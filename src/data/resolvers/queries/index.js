import users from './users';
import channels from './channels';
import brands from './brands';
import integrations from './integrations';
import { fieldQueries as fields, fieldsGroupQueries as fieldsgroups } from './fields';
import forms from './forms';
import responseTemplates from './responseTemplates';
import emailTemplates from './emailTemplates';
import engages from './engages';
import tags from './tags';
import internalNotes from './internalNotes';
import customers from './customers';
import companies from './companies';
import segments from './segments';
import conversations from './conversations';
import insights from './insights';
import knowledgeBase from './knowledgeBase';
import notifications from './notifications';
import activityLogs from './activityLogs';
import permissions from './permissions';
import usersGroup from './usersGroup';

export default {
  ...users,
  ...channels,
  ...brands,
  ...integrations,
  ...fields,
  ...forms,
  ...responseTemplates,
  ...emailTemplates,
  ...engages,
  ...tags,
  ...internalNotes,
  ...customers,
  ...companies,
  ...segments,
  ...conversations,
  ...insights,
  ...knowledgeBase,
  ...notifications,
  ...activityLogs,
  ...fieldsgroups,
  ...permissions,
  ...usersGroup,
};
