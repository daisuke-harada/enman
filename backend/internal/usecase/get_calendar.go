package usecase

import (
	"context"
	"time"

	"github.com/daisuke-harada/enman/internal/apperror"
	"github.com/daisuke-harada/enman/internal/domain/model"
	"github.com/daisuke-harada/enman/internal/domain/repository"
)

type GetCalendarInputPort interface {
	Execute(ctx context.Context, input GetCalendarInput) (*GetCalendarOutput, error)
}

type GetCalendarInput struct {
	Year          int
	Month         int
	CurrentUserID uint
}

type CalendarTask struct {
	TaskID           *uint
	RecurrenceRuleID *uint
	Title            string
	Category         *string
	Status           string
	UserID           uint
	UserName         string
	ScheduledDate    time.Time
}

type CalendarDay struct {
	Date  time.Time
	Tasks []CalendarTask
}

type GetCalendarOutput struct {
	Days []CalendarDay
}

type GetCalendarInteractor struct {
	UserRepo repository.UserRepository
	RuleRepo repository.RecurrenceRuleRepository
	TaskRepo repository.TaskRepository
}

func NewGetCalendarInteractor(userRepo repository.UserRepository, ruleRepo repository.RecurrenceRuleRepository, taskRepo repository.TaskRepository) *GetCalendarInteractor {
	return &GetCalendarInteractor{UserRepo: userRepo, RuleRepo: ruleRepo, TaskRepo: taskRepo}
}

func (i *GetCalendarInteractor) Execute(ctx context.Context, input GetCalendarInput) (*GetCalendarOutput, error) {
	user, err := i.UserRepo.FindByID(ctx, input.CurrentUserID)
	if err != nil || user.FamilyID == nil {
		return nil, apperror.UnprocessableEntity("家族グループに参加してください")
	}
	familyID := *user.FamilyID

	firstDay := time.Date(input.Year, time.Month(input.Month), 1, 0, 0, 0, 0, time.UTC)
	lastDay := firstDay.AddDate(0, 1, -1)
	nextMonthStart := firstDay.AddDate(0, 1, 0)

	members, err := i.UserRepo.FindByFamilyID(ctx, familyID)
	if err != nil {
		return nil, apperror.InternalServerError(err)
	}
	memberMap := make(map[uint]string, len(members))
	for _, m := range members {
		memberMap[m.ID] = m.Name
	}

	rules, err := i.RuleRepo.FindByFamilyID(ctx, familyID)
	if err != nil {
		return nil, apperror.InternalServerError(err)
	}

	tasks, err := i.TaskRepo.Search(ctx, repository.TaskSearchParams{
		FamilyID:            &familyID,
		ScheduledMonthStart: &firstDay,
		ScheduledMonthEnd:   &nextMonthStart,
	})
	if err != nil {
		return nil, apperror.InternalServerError(err)
	}

	// scheduled_date でインデックス: key = "ruleID_date" or "task_YYYYMMDD"
	type instanceKey struct {
		ruleID uint
		date   string
	}
	actualInstances := make(map[instanceKey]*model.Task)
	for _, t := range tasks {
		if t.RecurrenceRuleID != nil && t.ScheduledDate != nil {
			key := instanceKey{ruleID: *t.RecurrenceRuleID, date: t.ScheduledDate.Format("2006-01-02")}
			actualInstances[key] = t
		}
	}

	// 各日のタスクスライス
	days := buildDays(firstDay, lastDay)
	dayIndex := make(map[string]int, len(days))
	for idx, d := range days {
		dayIndex[d.Date.Format("2006-01-02")] = idx
	}

	// 繰り返しルールを展開
	for _, rule := range rules {
		if rule.EndDate != nil && rule.EndDate.Before(firstDay) {
			continue
		}
		occurrences := expandRule(rule, firstDay, lastDay)
		for _, date := range occurrences {
			dateStr := date.Format("2006-01-02")
			key := instanceKey{ruleID: rule.ID, date: dateStr}
			idx := dayIndex[dateStr]

			if actual, ok := actualInstances[key]; ok {
				// 実体化済みタスクを使う
				taskIDCopy := actual.ID
				ruleIDCopy := rule.ID
				days[idx].Tasks = append(days[idx].Tasks, CalendarTask{
					TaskID:           &taskIDCopy,
					RecurrenceRuleID: &ruleIDCopy,
					Title:            actual.Title,
					Category:         actual.Category,
					Status:           string(actual.Status),
					UserID:           actual.CreatedBy,
					UserName:         memberMap[actual.CreatedBy],
					ScheduledDate:    date,
				})
			} else {
				// 仮想インスタンス
				ruleIDCopy := rule.ID
				days[idx].Tasks = append(days[idx].Tasks, CalendarTask{
					TaskID:           nil,
					RecurrenceRuleID: &ruleIDCopy,
					Title:            rule.Title,
					Category:         rule.Category,
					Status:           "pending",
					UserID:           rule.CreatedBy,
					UserName:         memberMap[rule.CreatedBy],
					ScheduledDate:    date,
				})
			}
		}
	}

	// scheduled_date を持つ非繰り返しタスク（done）を追加
	for _, t := range tasks {
		if t.RecurrenceRuleID != nil {
			continue // 繰り返しタスクは上で処理済み
		}
		if t.ScheduledDate == nil {
			continue
		}
		dateStr := t.ScheduledDate.Format("2006-01-02")
		if idx, ok := dayIndex[dateStr]; ok {
			taskIDCopy := t.ID
			days[idx].Tasks = append(days[idx].Tasks, CalendarTask{
				TaskID:        &taskIDCopy,
				Title:         t.Title,
				Category:      t.Category,
				Status:        string(t.Status),
				UserID:        t.CreatedBy,
				UserName:      memberMap[t.CreatedBy],
				ScheduledDate: *t.ScheduledDate,
			})
		}
	}

	return &GetCalendarOutput{Days: days}, nil
}

func buildDays(firstDay, lastDay time.Time) []CalendarDay {
	days := make([]CalendarDay, 0, 31)
	for d := firstDay; !d.After(lastDay); d = d.AddDate(0, 0, 1) {
		days = append(days, CalendarDay{Date: d, Tasks: []CalendarTask{}})
	}
	return days
}

func expandRule(rule *model.RecurrenceRule, firstDay, lastDay time.Time) []time.Time {
	var dates []time.Time
	for d := firstDay; !d.After(lastDay); d = d.AddDate(0, 0, 1) {
		if d.Before(rule.StartDate) {
			continue
		}
		if rule.EndDate != nil && d.After(*rule.EndDate) {
			break
		}
		if ruleMatchesDate(rule, d) {
			dates = append(dates, d)
		}
	}
	return dates
}

func ruleMatchesDate(rule *model.RecurrenceRule, d time.Time) bool {
	switch rule.Frequency {
	case model.RecurrenceFrequencyDaily:
		return true
	case model.RecurrenceFrequencyWeekly:
		if rule.DayOfWeek == nil {
			return false
		}
		return int(d.Weekday()) == int(*rule.DayOfWeek)
	case model.RecurrenceFrequencyMonthly:
		if rule.WeekOfMonth != nil && rule.DayOfWeek != nil {
			return isNthWeekdayOfMonth(d, int(*rule.DayOfWeek), int(*rule.WeekOfMonth))
		}
		if rule.DayOfMonth != nil {
			return d.Day() == int(*rule.DayOfMonth)
		}
		return false
	}
	return false
}

// isNthWeekdayOfMonth は d がその月の第N weekday かどうかを返す（weekday: 0=日〜6=土）
func isNthWeekdayOfMonth(d time.Time, weekday, n int) bool {
	if int(d.Weekday()) != weekday {
		return false
	}
	count := 0
	for day := 1; day <= d.Day(); day++ {
		t := time.Date(d.Year(), d.Month(), day, 0, 0, 0, 0, d.Location())
		if int(t.Weekday()) == weekday {
			count++
		}
	}
	return count == n
}
