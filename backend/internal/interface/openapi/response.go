package openapi

import (
	openapi_types "github.com/oapi-codegen/runtime/types"

	"github.com/daisuke-harada/enman/internal/domain/model"
	"github.com/daisuke-harada/enman/internal/domain/repository"
	"github.com/daisuke-harada/enman/internal/usecase"
)


func NewUserResponse(user *model.User) UserResponse {
	id := int64(user.ID)
	resp := UserResponse{
		Id:         &id,
		Name:       &user.Name,
		Role:       &user.Role,
		Email:      &user.Email,
		EnmanPoint: &user.EnmanPoint,
		CreatedAt:  &user.CreatedAt,
		IconUrl:    user.IconURL,
	}
	if user.FamilyID != nil {
		fid := int64(*user.FamilyID)
		resp.FamilyId = &fid
	}
	if user.Family != nil {
		resp.InviteCode = &user.Family.InviteCode
	}
	return resp
}

func NewFamilyResponse(family *model.Family) FamilyResponse {
	id := int64(family.ID)
	return FamilyResponse{
		Id:         &id,
		Name:       &family.Name,
		InviteCode: &family.InviteCode,
		CreatedAt:  &family.CreatedAt,
	}
}

func NewAuthResponseFromRegister(out *usecase.RegisterUserOutput) AuthResponse {
	userResp := NewUserResponse(out.User)
	return AuthResponse{
		User:         &userResp,
		AccessToken:  &out.AccessToken,
		RefreshToken: &out.RefreshToken,
	}
}

func NewAuthResponseFromLogin(out *usecase.LoginUserOutput) AuthResponse {
	userResp := NewUserResponse(out.User)
	return AuthResponse{
		User:         &userResp,
		AccessToken:  &out.AccessToken,
		RefreshToken: &out.RefreshToken,
	}
}

func NewTokenResponse(out *usecase.RefreshAccessTokenOutput) TokenResponse {
	return TokenResponse{
		AccessToken:  &out.AccessToken,
		RefreshToken: &out.RefreshToken,
	}
}

func NewTaskResponse(task *model.Task) TaskResponse {
	id := int64(task.ID)
	familyID := int64(task.FamilyID)
	createdBy := int64(task.CreatedBy)
	status := TaskResponseStatus(task.Status)
	resp := TaskResponse{
		Id:        &id,
		FamilyId:  &familyID,
		CreatedBy: &createdBy,
		Title:     &task.Title,
		Category:  task.Category,
		Status:    &status,
		DoneAt:    task.DoneAt,
		CreatedAt: &task.CreatedAt,
	}
	if task.DoneBy != nil {
		doneBy := int64(*task.DoneBy)
		resp.DoneBy = &doneBy
	}
	comments := make([]AppreciationResponse, 0, len(task.Appreciations))
	for _, a := range task.Appreciations {
		comments = append(comments, NewAppreciationResponse(a))
	}
	resp.Comments = &comments
	return resp
}

func NewTaskTemplateResponse(tmpl *model.TaskTemplate) TaskTemplateResponse {
	id := int64(tmpl.ID)
	return TaskTemplateResponse{
		Id:       &id,
		Name:     &tmpl.Name,
		Category: &tmpl.Category,
	}
}

func NewAppreciationResponse(a *model.Appreciation) AppreciationResponse {
	id := int64(a.ID)
	taskID := int64(a.TaskID)
	fromUserID := int64(a.FromUserID)
	toUserID := int64(a.ToUserID)

	resp := AppreciationResponse{
		Id:         &id,
		TaskId:     &taskID,
		FromUserId: &fromUserID,
		ToUserId:   &toUserID,
		Message:    a.Message,
		CreatedAt:  &a.CreatedAt,
	}
	if a.Task != nil {
		resp.TaskTitle = &a.Task.Title
	}
	if a.FromUser != nil {
		resp.FromUserName = &a.FromUser.Name
	}
	if a.ToUser != nil {
		resp.ToUserName = &a.ToUser.Name
	}
	return resp
}

func NewContributionItemResponse(item *repository.ContributionItem) ContributionItem {
	userID := int64(item.UserID)
	return ContributionItem{
		UserId:   &userID,
		UserName: &item.UserName,
		Category: &item.Category,
		Count:    &item.Count,
	}
}

func NewFamilyGoalResponse(gwp *usecase.FamilyGoalWithPoints) FamilyGoalResponse {
	id := int64(gwp.Goal.ID)
	return FamilyGoalResponse{
		Id:            &id,
		Title:         &gwp.Goal.Title,
		TargetPoints:  &gwp.Goal.TargetPoints,
		CurrentPoints: &gwp.CurrentPoints,
		CreatedAt:     &gwp.Goal.CreatedAt,
	}
}

func NewRecurrenceRuleResponse(rule *model.RecurrenceRule) RecurrenceRuleResponse {
	id := int64(rule.ID)
	familyID := int64(rule.FamilyID)
	createdBy := int64(rule.CreatedBy)
	freq := RecurrenceRuleResponseFrequency(rule.Frequency)
	startDate := openapi_types.Date{Time: rule.StartDate}
	resp := RecurrenceRuleResponse{
		Id:        &id,
		FamilyId:  &familyID,
		CreatedBy: &createdBy,
		Title:     &rule.Title,
		Category:  rule.Category,
		Frequency: &freq,
		StartDate: &startDate,
		CreatedAt: &rule.CreatedAt,
	}
	if rule.DayOfWeek != nil {
		dow := int(*rule.DayOfWeek)
		resp.DayOfWeek = &dow
	}
	if rule.DayOfMonth != nil {
		dom := int(*rule.DayOfMonth)
		resp.DayOfMonth = &dom
	}
	if rule.WeekOfMonth != nil {
		wom := int(*rule.WeekOfMonth)
		resp.WeekOfMonth = &wom
	}
	if rule.EndDate != nil {
		ed := openapi_types.Date{Time: *rule.EndDate}
		resp.EndDate = &ed
	}
	return resp
}

func NewCalendarDayItemResponse(day usecase.CalendarDay) CalendarDayItem {
	date := openapi_types.Date{Time: day.Date}
	tasks := make([]CalendarTaskItem, 0, len(day.Tasks))
	for _, t := range day.Tasks {
		status := CalendarTaskItemStatus(t.Status)
		scheduledDate := openapi_types.Date{Time: t.ScheduledDate}
		userID := int64(t.UserID)
		item := CalendarTaskItem{
			Title:         &t.Title,
			Category:      t.Category,
			Status:        &status,
			UserId:        &userID,
			UserName:      &t.UserName,
			ScheduledDate: &scheduledDate,
		}
		if t.TaskID != nil {
			tid := int64(*t.TaskID)
			item.TaskId = &tid
		}
		if t.RecurrenceRuleID != nil {
			rid := int64(*t.RecurrenceRuleID)
			item.RecurrenceRuleId = &rid
		}
		tasks = append(tasks, item)
	}
	return CalendarDayItem{
		Date:  &date,
		Tasks: &tasks,
	}
}

func NewTaskResponseWithSchedule(task *model.Task) TaskResponse {
	resp := NewTaskResponse(task)
	if task.RecurrenceRuleID != nil {
		rid := int64(*task.RecurrenceRuleID)
		resp.RecurrenceRuleId = &rid
	}
	if task.ScheduledDate != nil {
		sd := openapi_types.Date{Time: *task.ScheduledDate}
		resp.ScheduledDate = &sd
	}
	return resp
}
