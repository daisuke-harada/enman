package usecase

import (
	"context"

	"github.com/daisuke-harada/enman/internal/apperror"
	"github.com/daisuke-harada/enman/internal/domain/repository"
)

type DeleteTaskInputPort interface {
	Execute(ctx context.Context, input DeleteTaskInput) error
}

type DeleteTaskInput struct {
	TaskID        uint
	CurrentUserID uint
}

type DeleteTaskInteractor struct {
	TaskRepo repository.TaskRepository
	UserRepo repository.UserRepository
}

func NewDeleteTaskInteractor(taskRepo repository.TaskRepository, userRepo repository.UserRepository) *DeleteTaskInteractor {
	return &DeleteTaskInteractor{TaskRepo: taskRepo, UserRepo: userRepo}
}

func (i *DeleteTaskInteractor) Execute(ctx context.Context, input DeleteTaskInput) error {
	user, err := i.UserRepo.FindByID(ctx, input.CurrentUserID)
	if err != nil || user.FamilyID == nil {
		return apperror.Forbidden()
	}

	task, err := i.TaskRepo.FindByID(ctx, input.TaskID)
	if err != nil {
		return apperror.NotFound()
	}

	if task.FamilyID != *user.FamilyID {
		return apperror.Forbidden()
	}

	return i.TaskRepo.Delete(ctx, input.TaskID)
}
