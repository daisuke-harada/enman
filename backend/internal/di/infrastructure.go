package di

import (
	"context"

	"github.com/daisuke-harada/enman/internal/config"
	"github.com/daisuke-harada/enman/internal/infrastructure/db"
	"github.com/daisuke-harada/enman/internal/infrastructure/persistence"
	"github.com/daisuke-harada/enman/internal/usecase"
	"go.uber.org/dig"
	"gorm.io/gorm"
)

// ProvideDB provides *gorm.DB constructed by infrastructure/db.Connect.
func ProvideDB(cfg *config.Config) (*gorm.DB, error) {
	return db.Connect(context.Background(), cfg.DB)
}

// ProvideRepositories は全リポジトリのコンストラクタを Container に登録します。
func ProvideRepositories(ct *Container) {
	ct.MustProvide(persistence.NewUserRepository)
	ct.MustProvide(persistence.NewFamilyRepository)
	ct.MustProvide(persistence.NewRefreshTokenRepository)
	ct.MustProvide(persistence.NewTaskRepository)
	ct.MustProvide(persistence.NewTaskTemplateRepository)
	ct.MustProvide(persistence.NewRecurrenceRuleRepository)
	ct.MustProvide(persistence.NewAppreciationRepository)
	ct.MustProvide(persistence.NewFamilyGoalRepository)
	ct.MustProvide(persistence.NewStatsRepository)
}

// ProvideServices は全ドメインサービスのコンストラクタを Container に登録します。
func ProvideServices(ct *Container) {
}

// ProvideUsecases は全ユースケースのコンストラクタを Container に登録します。
func ProvideUsecases(ct *Container) {
	ct.MustProvide(usecase.NewRegisterUserInteractor, dig.As(new(usecase.RegisterUserInputPort)))
	ct.MustProvide(usecase.NewLoginUserInteractor, dig.As(new(usecase.LoginUserInputPort)))
	ct.MustProvide(usecase.NewRefreshAccessTokenInteractor, dig.As(new(usecase.RefreshAccessTokenInputPort)))
	ct.MustProvide(usecase.NewLogoutUserInteractor, dig.As(new(usecase.LogoutUserInputPort)))
	ct.MustProvide(usecase.NewCreateFamilyInteractor, dig.As(new(usecase.CreateFamilyInputPort)))
	ct.MustProvide(usecase.NewJoinFamilyInteractor, dig.As(new(usecase.JoinFamilyInputPort)))
	ct.MustProvide(usecase.NewGetCurrentUserInteractor, dig.As(new(usecase.GetCurrentUserInputPort)))
	ct.MustProvide(usecase.NewUpdateProfileInteractor, dig.As(new(usecase.UpdateProfileInputPort)))
	ct.MustProvide(usecase.NewCreateTaskInteractor, dig.As(new(usecase.CreateTaskInputPort)))
	ct.MustProvide(usecase.NewUpdateTaskInteractor, dig.As(new(usecase.UpdateTaskInputPort)))
	ct.MustProvide(usecase.NewDeleteTaskInteractor, dig.As(new(usecase.DeleteTaskInputPort)))
	ct.MustProvide(usecase.NewCompleteTaskInteractor, dig.As(new(usecase.CompleteTaskInputPort)))
	ct.MustProvide(usecase.NewListTasksInteractor, dig.As(new(usecase.ListTasksInputPort)))
	ct.MustProvide(usecase.NewListTaskTemplatesInteractor, dig.As(new(usecase.ListTaskTemplatesInputPort)))
	ct.MustProvide(usecase.NewSendAppreciationInteractor, dig.As(new(usecase.SendAppreciationInputPort)))
	ct.MustProvide(usecase.NewListNotificationsInteractor, dig.As(new(usecase.ListNotificationsInputPort)))
	ct.MustProvide(usecase.NewGetContributionsInteractor, dig.As(new(usecase.GetContributionsInputPort)))
	ct.MustProvide(usecase.NewGetFamilyTimelineInteractor, dig.As(new(usecase.GetFamilyTimelineInputPort)))
	ct.MustProvide(usecase.NewListFamilyGoalsInteractor, dig.As(new(usecase.ListFamilyGoalsInputPort)))
	ct.MustProvide(usecase.NewCreateFamilyGoalInteractor, dig.As(new(usecase.CreateFamilyGoalInputPort)))
	ct.MustProvide(usecase.NewCreateRecurrenceRuleInteractor, dig.As(new(usecase.CreateRecurrenceRuleInputPort)))
	ct.MustProvide(usecase.NewUpdateRecurrenceRuleInteractor, dig.As(new(usecase.UpdateRecurrenceRuleInputPort)))
	ct.MustProvide(usecase.NewDeleteRecurrenceRuleInteractor, dig.As(new(usecase.DeleteRecurrenceRuleInputPort)))
	ct.MustProvide(usecase.NewListRecurrenceRulesInteractor, dig.As(new(usecase.ListRecurrenceRulesInputPort)))
	ct.MustProvide(usecase.NewGetCalendarInteractor, dig.As(new(usecase.GetCalendarInputPort)))
}
