package usecase

import (
	"context"
	"time"

	"github.com/daisuke-harada/enman/internal/apperror"
	"github.com/daisuke-harada/enman/internal/domain/model"
	"github.com/daisuke-harada/enman/internal/domain/repository"
)

type CompleteTaskInputPort interface {
	Execute(ctx context.Context, input CompleteTaskInput) (*CompleteTaskOutput, error)
}

type CompleteTaskInput struct {
	TaskID        uint
	CurrentUserID uint
}

type CompleteTaskOutput struct {
	Task *model.Task
}

type CompleteTaskInteractor struct {
	TaskRepo repository.TaskRepository
	UserRepo repository.UserRepository
}

func NewCompleteTaskInteractor(taskRepo repository.TaskRepository, userRepo repository.UserRepository) *CompleteTaskInteractor {
	return &CompleteTaskInteractor{TaskRepo: taskRepo, UserRepo: userRepo}
}

func (i *CompleteTaskInteractor) Execute(ctx context.Context, input CompleteTaskInput) (*CompleteTaskOutput, error) {
	user, err := i.UserRepo.FindByID(ctx, input.CurrentUserID)
	if err != nil || user.FamilyID == nil {
		return nil, apperror.Forbidden("家族グループに参加していません")
	}

	task, err := i.TaskRepo.FindByID(ctx, input.TaskID)
	if err != nil {
		return nil, apperror.NotFound("タスクが見つかりません")
	}

	if task.FamilyID != *user.FamilyID {
		return nil, apperror.Forbidden("このタスクにアクセスする権限がありません")
	}

	if task.Status == model.TaskStatusDone {
		return nil, apperror.UnprocessableEntity("このタスクはすでに完了済みです")
	}

	now := time.Now()
	task.Status = model.TaskStatusDone
	task.DoneBy = &input.CurrentUserID
	task.DoneAt = &now

	if err := i.TaskRepo.Update(ctx, task); err != nil {
		return nil, apperror.InternalServerError(err)
	}

	return &CompleteTaskOutput{Task: task}, nil
}
