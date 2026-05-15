package usecase

import (
	"context"
	"time"

	"github.com/daisuke-harada/enman/internal/apperror"
	"github.com/daisuke-harada/enman/internal/domain/model"
	"github.com/daisuke-harada/enman/internal/domain/repository"
)

type ListTasksInputPort interface {
	Execute(ctx context.Context, input ListTasksInput) (*ListTasksOutput, error)
}

type TaskFilter string

const (
	TaskFilterPending   TaskFilter = "pending"
	TaskFilterTodayDone TaskFilter = "today_done"
)

type ListTasksInput struct {
	CurrentUserID uint
	Filter        *TaskFilter
}

type ListTasksOutput struct {
	Tasks []*model.Task
}

type ListTasksInteractor struct {
	TaskRepo repository.TaskRepository
	UserRepo repository.UserRepository
}

func NewListTasksInteractor(taskRepo repository.TaskRepository, userRepo repository.UserRepository) *ListTasksInteractor {
	return &ListTasksInteractor{TaskRepo: taskRepo, UserRepo: userRepo}
}

func (i *ListTasksInteractor) Execute(ctx context.Context, input ListTasksInput) (*ListTasksOutput, error) {
	user, err := i.UserRepo.FindByID(ctx, input.CurrentUserID)
	if err != nil || user.FamilyID == nil {
		return nil, apperror.UnprocessableEntity("家族グループに参加してからタスクを確認できます")
	}

	params := repository.TaskSearchParams{FamilyID: user.FamilyID}

	if input.Filter != nil {
		switch *input.Filter {
		case TaskFilterPending:
			s := model.TaskStatusPending
			params.Status = &s
		case TaskFilterTodayDone:
			s := model.TaskStatusDone
			params.Status = &s
			today := time.Now()
			params.DoneOnDate = &today
		}
	}

	tasks, err := i.TaskRepo.Search(ctx, params)
	if err != nil {
		return nil, apperror.InternalServerError(err)
	}

	return &ListTasksOutput{Tasks: tasks}, nil
}
