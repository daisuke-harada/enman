// seed はデータベースにシードデータを投入するツールです。
package main

import (
	"context"
	"log/slog"
	"time"

	"github.com/daisuke-harada/enman/internal/config"
	"github.com/daisuke-harada/enman/internal/domain/model"
	"github.com/daisuke-harada/enman/internal/infrastructure/db"
	"github.com/daisuke-harada/enman/pkg/logger"
	"golang.org/x/crypto/bcrypt"
	"gorm.io/gorm"
)

// ─────────────────────────────────────────────
// タスクテンプレート
// ─────────────────────────────────────────────
var taskTemplates = []model.TaskTemplate{
	{Name: "皿洗い", Category: "キッチン"},
	{Name: "料理", Category: "キッチン"},
	{Name: "食材の買い出し", Category: "キッチン"},
	{Name: "ゴミ出し", Category: "ゴミ"},
	{Name: "ゴミ袋のセット", Category: "ゴミ"},
	{Name: "掃除機がけ", Category: "掃除"},
	{Name: "トイレ掃除", Category: "掃除"},
	{Name: "お風呂掃除", Category: "掃除"},
	{Name: "床の拭き掃除", Category: "掃除"},
	{Name: "洗濯", Category: "洗濯"},
	{Name: "洗濯物の干し", Category: "洗濯"},
	{Name: "洗濯物の取り込み", Category: "洗濯"},
	{Name: "アイロンがけ", Category: "洗濯"},
	{Name: "子どものお風呂", Category: "育児"},
	{Name: "子どもの寝かしつけ", Category: "育児"},
	{Name: "保育園・学校の準備", Category: "育児"},
	{Name: "電球・電池の交換", Category: "その他"},
	{Name: "郵便物の確認", Category: "その他"},
}

// ─────────────────────────────────────────────
// ヘルパー
// ─────────────────────────────────────────────
func mustHash(pw string) string {
	h, err := bcrypt.GenerateFromPassword([]byte(pw), bcrypt.DefaultCost)
	if err != nil {
		panic(err)
	}
	return string(h)
}

func ptr[T any](v T) *T { return &v }

// n 日前の特定時刻を返す（タイムラインを自然に見せるため時分秒を指定）
func daysAgo(days, hour, minute int) time.Time {
	now := time.Now()
	base := time.Date(now.Year(), now.Month(), now.Day(), hour, minute, 0, 0, now.Location())
	return base.AddDate(0, 0, -days)
}

// ─────────────────────────────────────────────
// main
// ─────────────────────────────────────────────
func main() {
	logger.Init("seed", false)
	defer logger.Close()

	cfg := config.Get()
	gormDB, err := db.Connect(context.Background(), cfg.DB)
	if err != nil {
		slog.Error("failed to connect db", "err", err)
		return
	}

	// ── 1. タスクテンプレート ──────────────────
	for _, tmpl := range taskTemplates {
		t := tmpl
		if err := gormDB.Where(model.TaskTemplate{Name: t.Name}).FirstOrCreate(&t).Error; err != nil {
			slog.Error("failed to seed task_template", "name", t.Name, "err", err)
			return
		}
	}
	slog.Info("seeded task_templates", "count", len(taskTemplates))

	// ── 2. 家族グループ ────────────────────────
	family := model.Family{Name: "田中家", InviteCode: "TANAKA000001"}
	if err := gormDB.Where("invite_code = ?", family.InviteCode).FirstOrCreate(&family).Error; err != nil {
		slog.Error("failed to seed family", "err", err)
		return
	}
	slog.Info("seeded family", "id", family.ID, "name", family.Name)

	// ── 3. ユーザー ────────────────────────────
	//
	// ポイント設計（感謝の収支）:
	//   ママ(ユミ) … 送る×5(+5pt)  受け取る×7(+21pt) = 26pt
	//   パパ(タカシ) … 送る×6(+6pt)  受け取る×4(+12pt) = 18pt
	//   長男(ハルト) … 送る×2(+2pt)  受け取る×2(+6pt)  =  8pt
	//   長女(サクラ) … 送る×2(+2pt)  受け取る×1(+3pt)  =  5pt
	//   合計ファミリーポイント = 57pt
	//   目標 80pt に対して 71% 達成の状態
	type userSeed struct {
		Email  string
		Name   string
		Role   string
		Points int
	}
	userSeeds := []userSeed{
		{"papa@tanaka.example", "タカシ", "パパ", 18},
		{"mama@tanaka.example", "ユミ", "ママ", 26},
		{"haruto@tanaka.example", "ハルト", "長男", 8},
		{"sakura@tanaka.example", "サクラ", "長女", 5},
	}
	users := make(map[string]*model.User, len(userSeeds))
	for _, s := range userSeeds {
		u := model.User{}
		result := gormDB.Where("email = ?", s.Email).First(&u)
		if result.Error == gorm.ErrRecordNotFound {
			u = model.User{
				FamilyID:       &family.ID,
				Name:           s.Name,
				Role:           s.Role,
				Email:          s.Email,
				PasswordDigest: mustHash("password123"),
				EnmanPoint:     s.Points,
			}
			if err := gormDB.Create(&u).Error; err != nil {
				slog.Error("failed to create user", "email", s.Email, "err", err)
				return
			}
		} else if result.Error != nil {
			slog.Error("failed to query user", "email", s.Email, "err", result.Error)
			return
		} else {
			// 既存ユーザーのポイントとファミリーIDを更新
			u.FamilyID = &family.ID
			u.EnmanPoint = s.Points
			if err := gormDB.Save(&u).Error; err != nil {
				slog.Error("failed to update user", "email", s.Email, "err", err)
				return
			}
		}
		users[s.Email] = &u
	}
	papa := users["papa@tanaka.example"]
	mama := users["mama@tanaka.example"]
	haruto := users["haruto@tanaka.example"]
	sakura := users["sakura@tanaka.example"]
	slog.Info("seeded users", "count", len(users))

	// ── 4. タスク ──────────────────────────────
	type taskSeed struct {
		Title     string
		Category  string
		Status    model.TaskStatus
		CreatedBy *model.User
		DoneBy    *model.User
		DoneAt    *time.Time
		CreatedAt time.Time
	}
	taskSeeds := []taskSeed{
		// ── 完了タスク（12件）──
		{
			Title: "皿洗い", Category: "キッチン",
			Status: model.TaskStatusDone, CreatedBy: mama, DoneBy: mama,
			DoneAt: ptr(daysAgo(5, 20, 30)), CreatedAt: daysAgo(5, 19, 0),
		},
		{
			Title: "ゴミ出し", Category: "ゴミ",
			Status: model.TaskStatusDone, CreatedBy: papa, DoneBy: papa,
			DoneAt: ptr(daysAgo(4, 7, 15)), CreatedAt: daysAgo(5, 22, 0),
		},
		{
			Title: "掃除機がけ", Category: "掃除",
			Status: model.TaskStatusDone, CreatedBy: mama, DoneBy: haruto,
			DoneAt: ptr(daysAgo(4, 15, 0)), CreatedAt: daysAgo(4, 10, 0),
		},
		{
			Title: "洗濯", Category: "洗濯",
			Status: model.TaskStatusDone, CreatedBy: mama, DoneBy: mama,
			DoneAt: ptr(daysAgo(3, 9, 0)), CreatedAt: daysAgo(3, 8, 0),
		},
		{
			Title: "洗濯物の干し", Category: "洗濯",
			Status: model.TaskStatusDone, CreatedBy: mama, DoneBy: sakura,
			DoneAt: ptr(daysAgo(3, 11, 30)), CreatedAt: daysAgo(3, 9, 30),
		},
		{
			Title: "夕食の料理", Category: "キッチン",
			Status: model.TaskStatusDone, CreatedBy: mama, DoneBy: mama,
			DoneAt: ptr(daysAgo(2, 18, 30)), CreatedAt: daysAgo(2, 17, 0),
		},
		{
			Title: "トイレ掃除", Category: "掃除",
			Status: model.TaskStatusDone, CreatedBy: papa, DoneBy: papa,
			DoneAt: ptr(daysAgo(2, 10, 0)), CreatedAt: daysAgo(2, 9, 0),
		},
		{
			Title: "加湿器の給水", Category: "その他",
			Status: model.TaskStatusDone, CreatedBy: papa, DoneBy: papa,
			DoneAt: ptr(daysAgo(2, 8, 0)), CreatedAt: daysAgo(2, 7, 30),
		},
		{
			Title: "お風呂掃除", Category: "掃除",
			Status: model.TaskStatusDone, CreatedBy: mama, DoneBy: mama,
			DoneAt: ptr(daysAgo(1, 19, 0)), CreatedAt: daysAgo(1, 18, 0),
		},
		{
			Title: "食材の買い出し", Category: "キッチン",
			Status: model.TaskStatusDone, CreatedBy: papa, DoneBy: papa,
			DoneAt: ptr(daysAgo(1, 11, 0)), CreatedAt: daysAgo(2, 20, 0),
		},
		{
			Title: "子どものお風呂", Category: "育児",
			Status: model.TaskStatusDone, CreatedBy: mama, DoneBy: mama,
			DoneAt: ptr(daysAgo(1, 20, 30)), CreatedAt: daysAgo(1, 19, 30),
		},
		{
			Title: "ゴミ袋のセット", Category: "ゴミ",
			Status: model.TaskStatusDone, CreatedBy: haruto, DoneBy: haruto,
			DoneAt: ptr(daysAgo(0, 8, 0)), CreatedAt: daysAgo(1, 22, 0),
		},
		// ── 未完了タスク（3件）──
		{
			Title: "アイロンがけ", Category: "洗濯",
			Status: model.TaskStatusPending, CreatedBy: mama,
			CreatedAt: daysAgo(1, 21, 0),
		},
		{
			Title: "郵便物の確認", Category: "その他",
			Status: model.TaskStatusPending, CreatedBy: papa,
			CreatedAt: daysAgo(0, 9, 0),
		},
		{
			Title: "床の拭き掃除", Category: "掃除",
			Status: model.TaskStatusPending, CreatedBy: papa,
			CreatedAt: daysAgo(0, 9, 30),
		},
	}
	tasks := make([]*model.Task, 0, len(taskSeeds))
	for _, s := range taskSeeds {
		task := model.Task{}
		result := gormDB.Where("family_id = ? AND title = ? AND created_by = ?",
			family.ID, s.Title, s.CreatedBy.ID).First(&task)
		if result.Error == gorm.ErrRecordNotFound {
			task = model.Task{
				FamilyID:  family.ID,
				CreatedBy: s.CreatedBy.ID,
				Title:     s.Title,
				Category:  &s.Category,
				Status:    s.Status,
				CreatedAt: s.CreatedAt,
			}
			if s.DoneBy != nil {
				task.DoneBy = &s.DoneBy.ID
				task.DoneAt = s.DoneAt
			}
			if err := gormDB.Create(&task).Error; err != nil {
				slog.Error("failed to create task", "title", s.Title, "err", err)
				return
			}
		} else if result.Error != nil {
			slog.Error("failed to query task", "title", s.Title, "err", result.Error)
			return
		}
		tasks = append(tasks, &task)
	}
	slog.Info("seeded tasks", "count", len(tasks))

	// タスクをタイトルで引けるように map 化
	taskByTitle := make(map[string]*model.Task)
	for _, t := range tasks {
		taskByTitle[t.Title] = t
	}

	// ── 5. 感謝スタンプ ────────────────────────
	type appreciationSeed struct {
		Task      *model.Task
		FromUser  *model.User
		ToUser    *model.User // task.DoneBy と一致する必要あり
		StampType model.StampType
		Message   *string
		CreatedAt time.Time
	}
	msg := func(s string) *string { return &s }
	appreciationSeeds := []appreciationSeed{
		// 皿洗い（mama→mama... ではなくpapaとharutoがmamaに送る）
		{
			Task: taskByTitle["皿洗い"], FromUser: papa, ToUser: mama,
			StampType: model.StampTypeThanks,
			Message:   msg("いつもきれいにしてくれてありがとう！"),
			CreatedAt: daysAgo(5, 21, 0),
		},
		{
			Task: taskByTitle["皿洗い"], FromUser: haruto, ToUser: mama,
			StampType: model.StampTypeCute,
			CreatedAt: daysAgo(5, 21, 30),
		},
		// ゴミ出し（mamaとsakuraがpapaに）
		{
			Task: taskByTitle["ゴミ出し"], FromUser: mama, ToUser: papa,
			StampType: model.StampTypeGreat,
			Message:   msg("朝早いのにありがとう！助かってます😊"),
			CreatedAt: daysAgo(4, 8, 0),
		},
		{
			Task: taskByTitle["ゴミ出し"], FromUser: sakura, ToUser: papa,
			StampType: model.StampTypeLove,
			CreatedAt: daysAgo(4, 9, 0),
		},
		// 掃除機がけ（papaとmamaがharutoに）
		{
			Task: taskByTitle["掃除機がけ"], FromUser: papa, ToUser: haruto,
			StampType: model.StampTypeGreat,
			Message:   msg("ハルト、隅までやってくれてありがとう！"),
			CreatedAt: daysAgo(4, 16, 0),
		},
		{
			Task: taskByTitle["掃除機がけ"], FromUser: mama, ToUser: haruto,
			StampType: model.StampTypeStar,
			CreatedAt: daysAgo(4, 16, 30),
		},
		// 洗濯（papaがmamaに）
		{
			Task: taskByTitle["洗濯"], FromUser: papa, ToUser: mama,
			StampType: model.StampTypeThanks,
			Message:   msg("毎日お疲れ様、助かってます！"),
			CreatedAt: daysAgo(3, 10, 0),
		},
		// 洗濯物の干し（mamaがsakuraに）
		{
			Task: taskByTitle["洗濯物の干し"], FromUser: mama, ToUser: sakura,
			StampType: model.StampTypeGreat,
			Message:   msg("サクラ、上手にできたね！えらい！"),
			CreatedAt: daysAgo(3, 12, 0),
		},
		// 夕食の料理（papaとharutoとsakuraがmamaに）
		{
			Task: taskByTitle["夕食の料理"], FromUser: papa, ToUser: mama,
			StampType: model.StampTypeLove,
			Message:   msg("今日の夕食、最高においしかった！！"),
			CreatedAt: daysAgo(2, 19, 0),
		},
		{
			Task: taskByTitle["夕食の料理"], FromUser: haruto, ToUser: mama,
			StampType: model.StampTypeStar,
			Message:   msg("ママの料理が世界一好き！"),
			CreatedAt: daysAgo(2, 19, 15),
		},
		{
			Task: taskByTitle["夕食の料理"], FromUser: sakura, ToUser: mama,
			StampType: model.StampTypeLove,
			CreatedAt: daysAgo(2, 19, 30),
		},
		// トイレ掃除（mamaがpapaに）
		{
			Task: taskByTitle["トイレ掃除"], FromUser: mama, ToUser: papa,
			StampType: model.StampTypeGreat,
			Message:   msg("ピカピカだね！いつもありがとう✨"),
			CreatedAt: daysAgo(2, 11, 0),
		},
		// 加湿器の給水（mamaがpapaに）
		{
			Task: taskByTitle["加湿器の給水"], FromUser: mama, ToUser: papa,
			StampType: model.StampTypeThanks,
			Message:   msg("気づいてくれてありがとう！のどが楽になった😊"),
			CreatedAt: daysAgo(2, 9, 0),
		},
		// お風呂掃除（papaがmamaに）
		{
			Task: taskByTitle["お風呂掃除"], FromUser: papa, ToUser: mama,
			StampType: model.StampTypeStar,
			Message:   msg("早いね、ありがとう！気持ちよく入れるよ"),
			CreatedAt: daysAgo(1, 20, 0),
		},
	}

	for _, s := range appreciationSeeds {
		if s.Task == nil || s.Task.ID == 0 {
			slog.Warn("skip appreciation: task not found")
			continue
		}
		ap := model.Appreciation{}
		result := gormDB.Where("task_id = ? AND from_user_id = ?", s.Task.ID, s.FromUser.ID).First(&ap)
		if result.Error == gorm.ErrRecordNotFound {
			ap = model.Appreciation{
				TaskID:     s.Task.ID,
				FromUserID: s.FromUser.ID,
				ToUserID:   s.ToUser.ID,
				StampType:  s.StampType,
				Message:    s.Message,
				CreatedAt:  s.CreatedAt,
			}
			if err := gormDB.Create(&ap).Error; err != nil {
				slog.Error("failed to create appreciation", "task_id", s.Task.ID, "err", err)
				return
			}
		} else if result.Error != nil {
			slog.Error("failed to query appreciation", "err", result.Error)
			return
		}
	}
	slog.Info("seeded appreciations", "count", len(appreciationSeeds))

	// ── 6. ご褒美目標 ─────────────────────────
	// 家族ポイント合計57pt、目標80ptで71%達成の状態
	goal := model.FamilyGoal{}
	if err := gormDB.Where("family_id = ? AND title = ?", family.ID, "週末みんなで焼肉🥩").
		FirstOrCreate(&goal, model.FamilyGoal{
			FamilyID:     family.ID,
			Title:        "週末みんなで焼肉🥩",
			TargetPoints: 80,
		}).Error; err != nil {
		slog.Error("failed to seed family_goal", "err", err)
		return
	}
	slog.Info("seeded family_goal", "title", goal.Title, "target", goal.TargetPoints)

	slog.Info("✅ all seed completed",
		"family", family.Name,
		"users", len(users),
		"tasks", len(tasks),
		"appreciations", len(appreciationSeeds),
		"family_points", 57,
		"goal_target", 80,
		"goal_progress_pct", "71%",
	)
}
