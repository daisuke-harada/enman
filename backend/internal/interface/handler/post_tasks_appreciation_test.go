package handler_test

import (
	"bytes"
	"encoding/json"
	"fmt"
	"net/http"
	"net/http/httptest"
	"testing"
	"time"

	"github.com/daisuke-harada/enman/internal/apperror"
	"github.com/daisuke-harada/enman/internal/domain/model"
	"github.com/daisuke-harada/enman/internal/interface/handler"
	"github.com/daisuke-harada/enman/internal/interface/middleware"
	"github.com/daisuke-harada/enman/internal/usecase"
	usecasemock "github.com/daisuke-harada/enman/internal/usecase/mock"
	"github.com/labstack/echo/v4"
	"go.uber.org/mock/gomock"
)

// newAppreciationContext は指定 userID・taskID・message のテスト用 Echo コンテキストを作成する。
func newAppreciationContext(e *echo.Echo, taskID int64, userID uint, message string) (echo.Context, *httptest.ResponseRecorder) {
	body, _ := json.Marshal(map[string]string{"message": message})
	req := httptest.NewRequest(http.MethodPost, fmt.Sprintf("/tasks/%d/appreciations", taskID), bytes.NewReader(body))
	req.Header.Set(echo.HeaderContentType, echo.MIMEApplicationJSON)
	rec := httptest.NewRecorder()
	c := e.NewContext(req, rec)
	c.SetParamNames("taskId")
	c.SetParamValues(fmt.Sprintf("%d", taskID))
	c.Set(middleware.CurrentUserIDKey, userID)
	return c, rec
}

// callHandler はハンドラーを呼び出し、エラーがあれば Echo の HTTPErrorHandler で処理する。
func callHandler(e *echo.Echo, h *handler.PostTasksAppreciationHandler, c echo.Context, taskID int64) {
	if err := h.PostTasksAppreciation(c, taskID); err != nil {
		e.HTTPErrorHandler(err, c)
	}
}

func newTestEcho() *echo.Echo {
	e := echo.New()
	e.HTTPErrorHandler = middleware.CustomHTTPErrorHandler
	return e
}

// ---- 正常系 ----

func TestPostTasksAppreciation_Success(t *testing.T) {
	ctrl := gomock.NewController(t)
	defer ctrl.Finish()

	const (
		taskID     = int64(5)
		fromUserID = uint(10)
		toUserID   = uint(20)
	)

	now := time.Now()
	msg := "いつもありがとう！"
	appreciation := &model.Appreciation{
		ID:         1,
		TaskID:     uint(taskID),
		FromUserID: fromUserID,
		ToUserID:   toUserID,
		Message:    &msg,
		CreatedAt:  now,
		FromUser:   &model.User{ID: fromUserID, Name: "太郎"},
	}

	mockUC := usecasemock.NewMockSendAppreciationInputPort(ctrl)
	mockUC.EXPECT().
		Execute(gomock.Any(), usecase.SendAppreciationInput{
			TaskID:     uint(taskID),
			FromUserID: fromUserID,
			Message:    msg,
		}).
		Return(&usecase.SendAppreciationOutput{Appreciation: appreciation}, nil)

	e := newTestEcho()
	h := &handler.PostTasksAppreciationHandler{InputPort: mockUC}
	c, rec := newAppreciationContext(e, taskID, fromUserID, msg)

	callHandler(e, h, c, taskID)

	if rec.Code != http.StatusCreated {
		t.Errorf("他ユーザーのタスクへの感謝: want 201, got %d (body: %s)", rec.Code, rec.Body.String())
	}
}

// ---- 異常系: 自己感謝 ----

// TestPostTasksAppreciation_SelfAppreciation は自分が完了したタスクへの感謝送信が
// 422 で拒否されることを確認する。
// このテストはバックエンドの自己感謝チェックが正しく機能することを保証する。
func TestPostTasksAppreciation_SelfAppreciation(t *testing.T) {
	ctrl := gomock.NewController(t)
	defer ctrl.Finish()

	const (
		taskID = int64(1)
		userID = uint(10) // 完了者と送信者が同一
	)

	mockUC := usecasemock.NewMockSendAppreciationInputPort(ctrl)
	// usecase が自己感謝エラーを返す（完了者 == 送信者）
	mockUC.EXPECT().
		Execute(gomock.Any(), usecase.SendAppreciationInput{
			TaskID:     uint(taskID),
			FromUserID: userID,
			Message:    "ありがとう",
		}).
		Return(nil, apperror.UnprocessableEntity("自分が完了したタスクにはコメントを送れません"))

	e := newTestEcho()
	h := &handler.PostTasksAppreciationHandler{InputPort: mockUC}
	c, rec := newAppreciationContext(e, taskID, userID, "ありがとう")

	callHandler(e, h, c, taskID)

	if rec.Code != http.StatusUnprocessableEntity {
		t.Errorf("自己感謝は拒否されるべき: want 422, got %d (body: %s)", rec.Code, rec.Body.String())
	}
}

// ---- 異常系: 未完了タスク ----

func TestPostTasksAppreciation_PendingTask(t *testing.T) {
	ctrl := gomock.NewController(t)
	defer ctrl.Finish()

	const (
		taskID = int64(2)
		userID = uint(10)
	)

	mockUC := usecasemock.NewMockSendAppreciationInputPort(ctrl)
	mockUC.EXPECT().
		Execute(gomock.Any(), usecase.SendAppreciationInput{
			TaskID:     uint(taskID),
			FromUserID: userID,
			Message:    "ありがとう",
		}).
		Return(nil, apperror.UnprocessableEntity("完了済みのタスクにのみコメントを送れます"))

	e := newTestEcho()
	h := &handler.PostTasksAppreciationHandler{InputPort: mockUC}
	c, rec := newAppreciationContext(e, taskID, userID, "ありがとう")

	callHandler(e, h, c, taskID)

	if rec.Code != http.StatusUnprocessableEntity {
		t.Errorf("未完了タスクへの感謝: want 422, got %d", rec.Code)
	}
}

// ---- 異常系: 空メッセージ ----

func TestPostTasksAppreciation_EmptyMessage(t *testing.T) {
	ctrl := gomock.NewController(t)
	defer ctrl.Finish()

	const (
		taskID = int64(3)
		userID = uint(10)
	)

	mockUC := usecasemock.NewMockSendAppreciationInputPort(ctrl)
	mockUC.EXPECT().
		Execute(gomock.Any(), usecase.SendAppreciationInput{
			TaskID:     uint(taskID),
			FromUserID: userID,
			Message:    "",
		}).
		Return(nil, apperror.UnprocessableEntity("コメントを入力してください"))

	e := newTestEcho()
	h := &handler.PostTasksAppreciationHandler{InputPort: mockUC}
	c, rec := newAppreciationContext(e, taskID, userID, "")

	callHandler(e, h, c, taskID)

	if rec.Code != http.StatusUnprocessableEntity {
		t.Errorf("空メッセージ: want 422, got %d", rec.Code)
	}
}

// ---- 異常系: 他家族のタスク ----

func TestPostTasksAppreciation_DifferentFamily(t *testing.T) {
	ctrl := gomock.NewController(t)
	defer ctrl.Finish()

	const (
		taskID = int64(99)
		userID = uint(10)
	)

	mockUC := usecasemock.NewMockSendAppreciationInputPort(ctrl)
	mockUC.EXPECT().
		Execute(gomock.Any(), usecase.SendAppreciationInput{
			TaskID:     uint(taskID),
			FromUserID: userID,
			Message:    "ありがとう",
		}).
		Return(nil, apperror.Forbidden("このタスクにアクセスする権限がありません"))

	e := newTestEcho()
	h := &handler.PostTasksAppreciationHandler{InputPort: mockUC}
	c, rec := newAppreciationContext(e, taskID, userID, "ありがとう")

	callHandler(e, h, c, taskID)

	if rec.Code != http.StatusForbidden {
		t.Errorf("他家族タスクへの感謝: want 403, got %d", rec.Code)
	}
}
