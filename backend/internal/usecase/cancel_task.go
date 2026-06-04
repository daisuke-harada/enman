package usecase

import (
	"context"

	"github.com/daisuke-harada/enman/internal/apperror"
	"github.com/daisuke-harada/enman/internal/domain/model"
	"github.com/daisuke-harada/enman/internal/domain/repository"
)

type CancelTaskInputPort interface {
	Execute(ctx context.Context, input CancelTaskInput) (*CancelTaskOutput, error)
}

type CancelTaskInput struct {
	TaskID        uint
	CurrentUserID uint
}

type CancelTaskOutput struct {
	Task *model.Task
}

type CancelTaskInteractor struct {
	TaskRepo repository.TaskRepository
	UserRepo repository.UserRepository
}

func NewCancelTaskInteractor(taskRepo repository.TaskRepository, userRepo repository.UserRepository) *CancelTaskInteractor {
	return &CancelTaskInteractor{TaskRepo: taskRepo, UserRepo: userRepo}
}

func (i *CancelTaskInteractor) Execute(ctx context.Context, input CancelTaskInput) (*CancelTaskOutput, error) {
	user, err := i.UserRepo.FindByID(ctx, input.CurrentUserID)
	if err != nil || user.FamilyID == nil {
		return nil, apperror.Forbidden()
	}

	task, err := i.TaskRepo.FindByID(ctx, input.TaskID)
	if err != nil {
		return nil, apperror.NotFound("タスクが見つかりません")
	}

	if task.FamilyID != *user.FamilyID {
		return nil, apperror.Forbidden()
	}

	task.Status = model.TaskStatusCancelled

	if err := i.TaskRepo.Update(ctx, task); err != nil {
		return nil, apperror.InternalServerError(err)
	}

	return &CancelTaskOutput{Task: task}, nil
}
