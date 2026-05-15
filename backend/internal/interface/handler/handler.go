package handler

import (
	"github.com/daisuke-harada/enman/internal/di"
	"github.com/daisuke-harada/enman/internal/usecase"
)

// NewHandler は DI コンテナから各ハンドラーを初期化して Handler を返します。
func NewHandler(container *di.Container) *Handler {
	return &Handler{
		PostAuthRegisterHandler: PostAuthRegisterHandler{
			InputPort: di.MustInvoke[usecase.RegisterUserInputPort](container),
		},
		PostAuthLoginHandler: PostAuthLoginHandler{
			InputPort: di.MustInvoke[usecase.LoginUserInputPort](container),
		},
		PostAuthRefreshHandler: PostAuthRefreshHandler{
			InputPort: di.MustInvoke[usecase.RefreshAccessTokenInputPort](container),
		},
		DeleteAuthLogoutHandler: DeleteAuthLogoutHandler{
			InputPort: di.MustInvoke[usecase.LogoutUserInputPort](container),
		},
		PostFamiliesHandler: PostFamiliesHandler{
			InputPort: di.MustInvoke[usecase.CreateFamilyInputPort](container),
		},
		PostFamiliesJoinHandler: PostFamiliesJoinHandler{
			InputPort: di.MustInvoke[usecase.JoinFamilyInputPort](container),
		},
		GetUsersMeHandler: GetUsersMeHandler{
			InputPort: di.MustInvoke[usecase.GetCurrentUserInputPort](container),
		},
		PatchUsersMeHandler: PatchUsersMeHandler{
			InputPort: di.MustInvoke[usecase.UpdateProfileInputPort](container),
		},
		GetHealthHandler: GetHealthHandler{},
	}
}
