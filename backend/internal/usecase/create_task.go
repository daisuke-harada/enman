package usecase

import (
	"context"
	"strings"

	"github.com/daisuke-harada/enman/internal/apperror"
	"github.com/daisuke-harada/enman/internal/domain/model"
	"github.com/daisuke-harada/enman/internal/domain/repository"
)

type CreateTaskInputPort interface {
	Execute(ctx context.Context, input CreateTaskInput) (*CreateTaskOutput, error)
}

type CreateTaskInput struct {
	Title         string
	Category      *string
	CurrentUserID uint
}

func (i *CreateTaskInput) Validate() error {
	var errs []string
	if strings.TrimSpace(i.Title) == "" {
		errs = append(errs, "タスク名を入力してください")
	}
	if len(errs) > 0 {
		return apperror.UnprocessableEntity(errs...)
	}
	return nil
}

type CreateTaskOutput struct {
	Task *model.Task
}

type CreateTaskInteractor struct {
	TaskRepo repository.TaskRepository
	UserRepo repository.UserRepository
}

func NewCreateTaskInteractor(taskRepo repository.TaskRepository, userRepo repository.UserRepository) *CreateTaskInteractor {
	return &CreateTaskInteractor{TaskRepo: taskRepo, UserRepo: userRepo}
}

func (i *CreateTaskInteractor) Execute(ctx context.Context, input CreateTaskInput) (*CreateTaskOutput, error) {
	if err := input.Validate(); err != nil {
		return nil, err
	}

	user, err := i.UserRepo.FindByID(ctx, input.CurrentUserID)
	if err != nil || user.FamilyID == nil {
		return nil, apperror.UnprocessableEntity("家族グループに参加してからタスクを作成してください")
	}

	task := &model.Task{
		FamilyID:  *user.FamilyID,
		CreatedBy: input.CurrentUserID,
		Title:     input.Title,
		Category:  input.Category,
		Status:    model.TaskStatusPending,
	}
	if err := i.TaskRepo.Create(ctx, task); err != nil {
		return nil, apperror.InternalServerError(err)
	}

	return &CreateTaskOutput{Task: task}, nil
}
