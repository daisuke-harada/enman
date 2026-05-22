package usecase

import (
	"context"
	"strings"

	"github.com/daisuke-harada/enman/internal/apperror"
	"github.com/daisuke-harada/enman/internal/domain/model"
	"github.com/daisuke-harada/enman/internal/domain/repository"
)

const (
	PointCompleteTask        = 1
	PointSendAppreciation    = 1
	PointReceiveAppreciation = 1
)

type SendAppreciationInputPort interface {
	Execute(ctx context.Context, input SendAppreciationInput) (*SendAppreciationOutput, error)
}

type SendAppreciationInput struct {
	TaskID     uint
	FromUserID uint
	Message    string
}

func (i *SendAppreciationInput) Validate() error {
	var errs []string

	if strings.TrimSpace(i.Message) == "" {
		errs = append(errs, "コメントを入力してください")
	}
	if len([]rune(i.Message)) > 255 {
		errs = append(errs, "コメントは255文字以内で入力してください")
	}

	if len(errs) > 0 {
		return apperror.UnprocessableEntity(errs...)
	}
	return nil
}

type SendAppreciationOutput struct {
	Appreciation *model.Appreciation
}

type SendAppreciationInteractor struct {
	AppreciationRepo repository.AppreciationRepository
	TaskRepo         repository.TaskRepository
	UserRepo         repository.UserRepository
}

func NewSendAppreciationInteractor(
	appreciationRepo repository.AppreciationRepository,
	taskRepo repository.TaskRepository,
	userRepo repository.UserRepository,
) *SendAppreciationInteractor {
	return &SendAppreciationInteractor{
		AppreciationRepo: appreciationRepo,
		TaskRepo:         taskRepo,
		UserRepo:         userRepo,
	}
}

func (i *SendAppreciationInteractor) Execute(ctx context.Context, input SendAppreciationInput) (*SendAppreciationOutput, error) {
	if err := input.Validate(); err != nil {
		return nil, err
	}

	fromUser, err := i.UserRepo.FindByID(ctx, input.FromUserID)
	if err != nil || fromUser.FamilyID == nil {
		return nil, apperror.Forbidden("家族グループに参加していません")
	}

	task, err := i.TaskRepo.FindByID(ctx, input.TaskID)
	if err != nil {
		return nil, apperror.NotFound("タスクが見つかりません")
	}

	if task.FamilyID != *fromUser.FamilyID {
		return nil, apperror.Forbidden("このタスクにアクセスする権限がありません")
	}

	if task.Status != model.TaskStatusDone || task.DoneBy == nil {
		return nil, apperror.UnprocessableEntity("完了済みのタスクにのみコメントを送れます")
	}

	if *task.DoneBy == input.FromUserID {
		return nil, apperror.UnprocessableEntity("自分が完了したタスクにはコメントを送れません")
	}

	appreciation := &model.Appreciation{
		TaskID:     input.TaskID,
		FromUserID: input.FromUserID,
		ToUserID:   *task.DoneBy,
		Message:    &input.Message,
	}

	if err := i.AppreciationRepo.Create(ctx, appreciation); err != nil {
		return nil, apperror.InternalServerError(err)
	}

	// ポイント付与
	fromUser.EnmanPoint += PointSendAppreciation
	if err := i.UserRepo.Update(ctx, fromUser); err != nil {
		return nil, apperror.InternalServerError(err)
	}

	toUser, err := i.UserRepo.FindByID(ctx, *task.DoneBy)
	if err != nil {
		return nil, apperror.InternalServerError(err)
	}
	toUser.EnmanPoint += PointReceiveAppreciation
	if err := i.UserRepo.Update(ctx, toUser); err != nil {
		return nil, apperror.InternalServerError(err)
	}

	appreciation.Task = task
	appreciation.FromUser = fromUser

	return &SendAppreciationOutput{Appreciation: appreciation}, nil
}
