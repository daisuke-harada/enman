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
		GetTasksHandler: GetTasksHandler{
			InputPort: di.MustInvoke[usecase.ListTasksInputPort](container),
		},
		PostTasksHandler: PostTasksHandler{
			InputPort: di.MustInvoke[usecase.CreateTaskInputPort](container),
		},
		PatchTaskHandler: PatchTaskHandler{
			InputPort: di.MustInvoke[usecase.UpdateTaskInputPort](container),
		},
		DeleteTaskHandler: DeleteTaskHandler{
			InputPort: di.MustInvoke[usecase.DeleteTaskInputPort](container),
		},
		PatchTasksDoneHandler: PatchTasksDoneHandler{
			InputPort: di.MustInvoke[usecase.CompleteTaskInputPort](container),
		},
		GetTaskTemplatesHandler: GetTaskTemplatesHandler{
			InputPort: di.MustInvoke[usecase.ListTaskTemplatesInputPort](container),
		},
		PostTasksAppreciationHandler: PostTasksAppreciationHandler{
			InputPort: di.MustInvoke[usecase.SendAppreciationInputPort](container),
		},
		GetNotificationsHandler: GetNotificationsHandler{
			InputPort: di.MustInvoke[usecase.ListNotificationsInputPort](container),
		},
		GetStatsContributionsHandler: GetStatsContributionsHandler{
			InputPort: di.MustInvoke[usecase.GetContributionsInputPort](container),
		},
		GetFamilyTimelineHandler: GetFamilyTimelineHandler{
			InputPort: di.MustInvoke[usecase.GetFamilyTimelineInputPort](container),
		},
		GetFamiliesGoalsHandler: GetFamiliesGoalsHandler{
			InputPort: di.MustInvoke[usecase.ListFamilyGoalsInputPort](container),
		},
		PostFamiliesGoalsHandler: PostFamiliesGoalsHandler{
			InputPort: di.MustInvoke[usecase.CreateFamilyGoalInputPort](container),
		},
		GetCalendarHandler: GetCalendarHandler{
			InputPort: di.MustInvoke[usecase.GetCalendarInputPort](container),
		},
		GetRecurrenceRulesHandler: GetRecurrenceRulesHandler{
			InputPort: di.MustInvoke[usecase.ListRecurrenceRulesInputPort](container),
		},
		PostRecurrenceRulesHandler: PostRecurrenceRulesHandler{
			InputPort: di.MustInvoke[usecase.CreateRecurrenceRuleInputPort](container),
		},
		PatchRecurrenceRulesHandler: PatchRecurrenceRulesHandler{
			InputPort: di.MustInvoke[usecase.UpdateRecurrenceRuleInputPort](container),
		},
		DeleteRecurrenceRuleHandler: DeleteRecurrenceRuleHandler{
			InputPort: di.MustInvoke[usecase.DeleteRecurrenceRuleInputPort](container),
		},
		GetHealthHandler: GetHealthHandler{},
	}
}
