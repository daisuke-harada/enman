package usecase_test

import (
	"context"
	"testing"
	"time"

	"github.com/daisuke-harada/enman/internal/domain/model"
	"github.com/daisuke-harada/enman/internal/domain/repository"
	repositorymock "github.com/daisuke-harada/enman/internal/domain/repository/mock"
	"github.com/daisuke-harada/enman/internal/usecase"
	"go.uber.org/mock/gomock"
)

func TestGetCalendarInteractor_Execute(t *testing.T) {
	ctrl := gomock.NewController(t)
	defer ctrl.Finish()
	ctx := context.Background()

	familyID := uint(1)

	t.Run("毎日ルールが全日に展開される", func(t *testing.T) {
		mockUserRepo := repositorymock.NewMockUserRepository(ctrl)
		mockRuleRepo := repositorymock.NewMockRecurrenceRuleRepository(ctrl)
		mockTaskRepo := repositorymock.NewMockTaskRepository(ctrl)

		start := time.Date(2026, 5, 1, 0, 0, 0, 0, time.UTC)
		mockUserRepo.EXPECT().FindByID(ctx, uint(10)).Return(&model.User{ID: 10, FamilyID: &familyID, Name: "ユミ"}, nil)
		mockUserRepo.EXPECT().FindByFamilyID(ctx, familyID).Return([]*model.User{
			{ID: 10, FamilyID: &familyID, Name: "ユミ"},
		}, nil)
		mockRuleRepo.EXPECT().FindByFamilyID(ctx, familyID).Return([]*model.RecurrenceRule{
			{
				ID:        1,
				FamilyID:  familyID,
				CreatedBy: 10,
				Title:     "皿洗い",
				Frequency: model.RecurrenceFrequencyDaily,
				StartDate: start,
			},
		}, nil)
		mockTaskRepo.EXPECT().Search(ctx, gomock.Any()).Return([]*model.Task{}, nil)

		interactor := usecase.NewGetCalendarInteractor(mockUserRepo, mockRuleRepo, mockTaskRepo)
		out, err := interactor.Execute(ctx, usecase.GetCalendarInput{
			Year:          2026,
			Month:         5,
			CurrentUserID: 10,
		})

		if err != nil {
			t.Fatalf("unexpected error: %v", err)
		}
		if len(out.Days) != 31 {
			t.Errorf("want 31 days, got %d", len(out.Days))
		}
		// 全日に皿洗いタスクがある
		for _, day := range out.Days {
			if len(day.Tasks) != 1 {
				t.Errorf("date %s: want 1 task, got %d", day.Date.Format("2006-01-02"), len(day.Tasks))
			}
		}
	})

	t.Run("週次ルール（月曜のみ）", func(t *testing.T) {
		mockUserRepo := repositorymock.NewMockUserRepository(ctrl)
		mockRuleRepo := repositorymock.NewMockRecurrenceRuleRepository(ctrl)
		mockTaskRepo := repositorymock.NewMockTaskRepository(ctrl)

		start := time.Date(2026, 5, 1, 0, 0, 0, 0, time.UTC)
		dayOfWeek := int8(1) // 月曜
		mockUserRepo.EXPECT().FindByID(ctx, uint(10)).Return(&model.User{ID: 10, FamilyID: &familyID, Name: "ユミ"}, nil)
		mockUserRepo.EXPECT().FindByFamilyID(ctx, familyID).Return([]*model.User{
			{ID: 10, FamilyID: &familyID, Name: "ユミ"},
		}, nil)
		mockRuleRepo.EXPECT().FindByFamilyID(ctx, familyID).Return([]*model.RecurrenceRule{
			{
				ID:        2,
				FamilyID:  familyID,
				CreatedBy: 10,
				Title:     "床掃除",
				Frequency: model.RecurrenceFrequencyWeekly,
				DayOfWeek: &dayOfWeek,
				StartDate: start,
			},
		}, nil)
		mockTaskRepo.EXPECT().Search(ctx, gomock.Any()).Return([]*model.Task{}, nil)

		interactor := usecase.NewGetCalendarInteractor(mockUserRepo, mockRuleRepo, mockTaskRepo)
		out, err := interactor.Execute(ctx, usecase.GetCalendarInput{
			Year:          2026,
			Month:         5,
			CurrentUserID: 10,
		})

		if err != nil {
			t.Fatalf("unexpected error: %v", err)
		}

		// 2026年5月の月曜日: 4, 11, 18, 25 → 4日
		mondayCount := 0
		for _, day := range out.Days {
			mondayCount += len(day.Tasks)
		}
		if mondayCount != 4 {
			t.Errorf("want 4 monday tasks, got %d", mondayCount)
		}
	})

	t.Run("実体化済みタスクがある日は仮想インスタンスを上書き", func(t *testing.T) {
		mockUserRepo := repositorymock.NewMockUserRepository(ctrl)
		mockRuleRepo := repositorymock.NewMockRecurrenceRuleRepository(ctrl)
		mockTaskRepo := repositorymock.NewMockTaskRepository(ctrl)

		ruleID := uint(1)
		scheduledDate := time.Date(2026, 5, 4, 0, 0, 0, 0, time.UTC)
		dayOfWeek := int8(1) // 月曜

		mockUserRepo.EXPECT().FindByID(ctx, uint(10)).Return(&model.User{ID: 10, FamilyID: &familyID, Name: "ユミ"}, nil)
		mockUserRepo.EXPECT().FindByFamilyID(ctx, familyID).Return([]*model.User{
			{ID: 10, FamilyID: &familyID, Name: "ユミ"},
		}, nil)
		mockRuleRepo.EXPECT().FindByFamilyID(ctx, familyID).Return([]*model.RecurrenceRule{
			{
				ID:        ruleID,
				FamilyID:  familyID,
				CreatedBy: 10,
				Title:     "床掃除",
				Frequency: model.RecurrenceFrequencyWeekly,
				DayOfWeek: &dayOfWeek,
				StartDate: time.Date(2026, 5, 1, 0, 0, 0, 0, time.UTC),
			},
		}, nil)
		taskID := uint(99)
		mockTaskRepo.EXPECT().Search(ctx, gomock.Any()).Return([]*model.Task{
			{
				ID:               taskID,
				FamilyID:         familyID,
				CreatedBy:        10,
				Title:            "床掃除",
				RecurrenceRuleID: &ruleID,
				ScheduledDate:    &scheduledDate,
				Status:           model.TaskStatusDone,
			},
		}, nil)

		interactor := usecase.NewGetCalendarInteractor(mockUserRepo, mockRuleRepo, mockTaskRepo)
		out, err := interactor.Execute(ctx, usecase.GetCalendarInput{
			Year:          2026,
			Month:         5,
			CurrentUserID: 10,
		})

		if err != nil {
			t.Fatalf("unexpected error: %v", err)
		}

		// 5/4(月)のタスクは done で task_id が 99
		may4 := time.Date(2026, 5, 4, 0, 0, 0, 0, time.UTC)
		for _, day := range out.Days {
			if day.Date.Equal(may4) {
				if len(day.Tasks) != 1 {
					t.Fatalf("may4: want 1 task, got %d", len(day.Tasks))
				}
				task := day.Tasks[0]
				if task.Status != "done" {
					t.Errorf("may4: want status=done, got %s", task.Status)
				}
				if task.TaskID == nil || *task.TaskID != 99 {
					t.Errorf("may4: want TaskID=99, got %v", task.TaskID)
				}
			}
		}
	})

	t.Run("ルールの start_date 前の日は展開しない", func(t *testing.T) {
		mockUserRepo := repositorymock.NewMockUserRepository(ctrl)
		mockRuleRepo := repositorymock.NewMockRecurrenceRuleRepository(ctrl)
		mockTaskRepo := repositorymock.NewMockTaskRepository(ctrl)

		// start_date が月の途中（5/15）
		start := time.Date(2026, 5, 15, 0, 0, 0, 0, time.UTC)
		mockUserRepo.EXPECT().FindByID(ctx, uint(10)).Return(&model.User{ID: 10, FamilyID: &familyID, Name: "ユミ"}, nil)
		mockUserRepo.EXPECT().FindByFamilyID(ctx, familyID).Return([]*model.User{
			{ID: 10, FamilyID: &familyID, Name: "ユミ"},
		}, nil)
		mockRuleRepo.EXPECT().FindByFamilyID(ctx, familyID).Return([]*model.RecurrenceRule{
			{
				ID:        1,
				FamilyID:  familyID,
				CreatedBy: 10,
				Title:     "皿洗い",
				Frequency: model.RecurrenceFrequencyDaily,
				StartDate: start,
			},
		}, nil)
		mockTaskRepo.EXPECT().Search(ctx, gomock.Any()).Return([]*model.Task{}, nil)

		interactor := usecase.NewGetCalendarInteractor(mockUserRepo, mockRuleRepo, mockTaskRepo)
		out, err := interactor.Execute(ctx, usecase.GetCalendarInput{
			Year:          2026,
			Month:         5,
			CurrentUserID: 10,
		})

		if err != nil {
			t.Fatalf("unexpected error: %v", err)
		}

		taskCount := 0
		for _, day := range out.Days {
			taskCount += len(day.Tasks)
		}
		// 5/15〜5/31 = 17日分
		if taskCount != 17 {
			t.Errorf("want 17 tasks, got %d", taskCount)
		}
	})

	t.Run("検索条件にカレンダー期間が渡される", func(t *testing.T) {
		mockUserRepo := repositorymock.NewMockUserRepository(ctrl)
		mockRuleRepo := repositorymock.NewMockRecurrenceRuleRepository(ctrl)
		mockTaskRepo := repositorymock.NewMockTaskRepository(ctrl)

		mockUserRepo.EXPECT().FindByID(ctx, uint(10)).Return(&model.User{ID: 10, FamilyID: &familyID, Name: "ユミ"}, nil)
		mockUserRepo.EXPECT().FindByFamilyID(ctx, familyID).Return([]*model.User{
			{ID: 10, FamilyID: &familyID, Name: "ユミ"},
		}, nil)
		mockRuleRepo.EXPECT().FindByFamilyID(ctx, familyID).Return([]*model.RecurrenceRule{}, nil)
		mockTaskRepo.EXPECT().Search(ctx, gomock.AssignableToTypeOf(repository.TaskSearchParams{})).DoAndReturn(
			func(_ context.Context, params repository.TaskSearchParams) ([]*model.Task, error) {
				if params.FamilyID == nil || *params.FamilyID != familyID {
					t.Error("want FamilyID set in search params")
				}
				if params.ScheduledMonthStart == nil || params.ScheduledMonthEnd == nil {
					t.Error("want month range set in search params")
				}
				return []*model.Task{}, nil
			},
		)

		interactor := usecase.NewGetCalendarInteractor(mockUserRepo, mockRuleRepo, mockTaskRepo)
		_, err := interactor.Execute(ctx, usecase.GetCalendarInput{
			Year:          2026,
			Month:         5,
			CurrentUserID: 10,
		})
		if err != nil {
			t.Fatalf("unexpected error: %v", err)
		}
	})
}
