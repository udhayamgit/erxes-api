import './setup.ts';

import * as faker from 'faker';
import * as sinon from 'sinon';
import * as messageBroker from '../messageBroker';

import {
  conversationFactory,
  conversationMessageFactory,
  customerFactory,
  integrationFactory,
  userFactory,
} from '../db/factories';
import { Conversations, Customers, Integrations, Users } from '../db/models';
import { CONVERSATION_STATUSES, KIND_CHOICES } from '../db/models/definitions/constants';

import { IntegrationsAPI } from '../data/dataSources';
import utils from '../data/utils';
import { graphqlRequest } from '../db/connection';
import { IConversationDocument } from '../db/models/definitions/conversations';
import { ICustomerDocument } from '../db/models/definitions/customers';
import { IUserDocument } from '../db/models/definitions/users';

const toJSON = value => {
  // sometimes object key order is different even though it has same value.
  return JSON.stringify(value, Object.keys(value).sort());
};

const spy = jest.spyOn(utils, 'sendNotification');

describe('Conversation message mutations', () => {
  let leadConversation: IConversationDocument;
  let facebookConversation: IConversationDocument;
  let facebookMessengerConversation: IConversationDocument;
  let messengerConversation: IConversationDocument;
  let chatfuelConversation: IConversationDocument;
  let twitterConversation: IConversationDocument;
  let whatsAppConversation: IConversationDocument;
  let viberConversation: IConversationDocument;
  let telegramConversation: IConversationDocument;
  let lineConversation: IConversationDocument;
  let twilioConversation: IConversationDocument;

  let user: IUserDocument;
  let customer: ICustomerDocument;

  const addMutation = `
    mutation conversationMessageAdd(
      $conversationId: String
      $content: String
      $mentionedUserIds: [String]
      $internal: Boolean
      $attachments: [AttachmentInput]
    ) {
      conversationMessageAdd(
        conversationId: $conversationId
        content: $content
        mentionedUserIds: $mentionedUserIds
        internal: $internal
        attachments: $attachments
      ) {
        conversationId
        content
        mentionedUserIds
        internal
        attachments {
          url
          name
          type
          size
        }
      }
    }
  `;

  let dataSources;

  beforeEach(async () => {
    dataSources = { IntegrationsAPI: new IntegrationsAPI() };

    user = await userFactory({});
    customer = await customerFactory({ primaryEmail: faker.internet.email() });

    const leadIntegration = await integrationFactory({
      kind: KIND_CHOICES.LEAD,
      messengerData: { welcomeMessage: 'welcome', notifyCustomer: true },
    });

    leadConversation = await conversationFactory({
      integrationId: leadIntegration._id,
      customerId: customer._id,
      assignedUserId: user._id,
      content: 'lead content',
    });

    const facebookIntegration = await integrationFactory({ kind: KIND_CHOICES.FACEBOOK_POST });
    facebookConversation = await conversationFactory({ integrationId: facebookIntegration._id });

    const facebookMessengerIntegration = await integrationFactory({ kind: KIND_CHOICES.FACEBOOK_MESSENGER });
    facebookMessengerConversation = await conversationFactory({ integrationId: facebookMessengerIntegration._id });

    const chatfuelIntegration = await integrationFactory({ kind: KIND_CHOICES.CHATFUEL });
    chatfuelConversation = await conversationFactory({ integrationId: chatfuelIntegration._id });

    const twitterIntegration = await integrationFactory({ kind: KIND_CHOICES.TWITTER_DM });
    twitterConversation = await conversationFactory({ integrationId: twitterIntegration._id });

    const whatsAppIntegration = await integrationFactory({ kind: KIND_CHOICES.WHATSAPP });
    whatsAppConversation = await conversationFactory({ integrationId: whatsAppIntegration._id });

    const viberIntegration = await integrationFactory({ kind: KIND_CHOICES.SMOOCH_VIBER });
    viberConversation = await conversationFactory({ integrationId: viberIntegration._id });

    const telegramIntegration = await integrationFactory({ kind: KIND_CHOICES.SMOOCH_TELEGRAM });
    telegramConversation = await conversationFactory({ integrationId: telegramIntegration._id });

    const lineIntegration = await integrationFactory({ kind: KIND_CHOICES.SMOOCH_LINE });
    lineConversation = await conversationFactory({ integrationId: lineIntegration._id });

    const twilioIntegration = await integrationFactory({ kind: KIND_CHOICES.SMOOCH_TWILIO });
    twilioConversation = await conversationFactory({ integrationId: twilioIntegration._id });

    const messengerIntegration = await integrationFactory({ kind: 'messenger' });
    messengerConversation = await conversationFactory({
      customerId: customer._id,
      firstRespondedUserId: user._id,
      firstRespondedDate: new Date(),
      integrationId: messengerIntegration._id,
      status: CONVERSATION_STATUSES.CLOSED,
    });
  });

  afterEach(async () => {
    // Clearing test data
    await Conversations.deleteMany({});
    await Users.deleteMany({});
    await Integrations.deleteMany({});
    await Customers.deleteMany({});

    spy.mockRestore();
  });

  test('Add internal conversation message', async () => {
    const args = {
      conversationId: messengerConversation._id,
      content: 'content',
      internal: true,
    };

    const response = await graphqlRequest(addMutation, 'conversationMessageAdd', args);

    expect(response.conversationId).toBe(args.conversationId);
    expect(response.content).toBe(args.content);
    expect(response.internal).toBeTruthy();
  });

  test('Add lead conversation message', async () => {
    process.env.DEFAULT_EMAIL_SERIVCE = ' ';
    process.env.COMPANY_EMAIL_FROM = ' ';

    const args = {
      conversationId: leadConversation._id,
      content: 'content',
      mentionedUserIds: [user._id],
      internal: false,
      attachments: [{ url: 'url', name: 'name', type: 'doc', size: 10 }],
    };

    const response = await graphqlRequest(addMutation, 'conversationMessageAdd', args);

    expect(response.content).toBe(args.content);
    expect(response.attachments[0]).toEqual({ url: 'url', name: 'name', type: 'doc', size: 10 });
    expect(toJSON(response.mentionedUserIds)).toEqual(toJSON(args.mentionedUserIds));
    expect(response.internal).toBe(args.internal);
  });

  test('Add messenger conversation message', async () => {
    const args = {
      conversationId: messengerConversation._id,
      content: 'content',
      fromBot: true,
    };

    const response = await graphqlRequest(addMutation, 'conversationMessageAdd', args);

    expect(response.conversationId).toBe(messengerConversation._id);
  });

  test('Add conversation message using third party integration', async () => {
    const mock = sinon.stub(messageBroker, 'sendMessage').callsFake(() => {
      return Promise.resolve('success');
    });

    const args = { conversationId: facebookConversation._id, content: 'content' };

    const response = await graphqlRequest(addMutation, 'conversationMessageAdd', args, { dataSources: {} });

    expect(response).toBeDefined();

    try {
      await graphqlRequest(addMutation, 'conversationMessageAdd', args, { dataSources });
    } catch (e) {
      expect(e).toBeDefined();
    }

    args.conversationId = facebookMessengerConversation._id;

    try {
      await graphqlRequest(addMutation, 'conversationMessageAdd', args, { dataSources });
    } catch (e) {
      expect(e).toBeDefined();
    }

    args.conversationId = chatfuelConversation._id;

    try {
      await graphqlRequest(addMutation, 'conversationMessageAdd', args, { dataSources });
    } catch (e) {
      expect(e).toBeDefined();
    }

    args.conversationId = twitterConversation._id;

    try {
      await graphqlRequest(addMutation, 'conversationMessageAdd', args, { dataSources });
    } catch (e) {
      expect(e).toBeDefined();
    }

    args.conversationId = whatsAppConversation._id;

    try {
      await graphqlRequest(addMutation, 'conversationMessageAdd', args, { dataSources });
    } catch (e) {
      expect(e).toBeDefined();
    }

    args.conversationId = viberConversation._id;

    try {
      await graphqlRequest(addMutation, 'conversationMessageAdd', args, { dataSources });
    } catch (e) {
      expect(e).toBeDefined();
    }

    args.conversationId = telegramConversation._id;

    try {
      await graphqlRequest(addMutation, 'conversationMessageAdd', args, { dataSources });
    } catch (e) {
      expect(e).toBeDefined();
    }

    args.conversationId = lineConversation._id;

    try {
      await graphqlRequest(addMutation, 'conversationMessageAdd', args, { dataSources });
    } catch (e) {
      expect(e).toBeDefined();
    }

    args.conversationId = twilioConversation._id;

    try {
      await graphqlRequest(addMutation, 'conversationMessageAdd', args, { dataSources });
    } catch (e) {
      expect(e).toBeDefined();
    }

    mock.restore();
  });

  test('Reply facebook comment', async () => {
    const commentMutation = `
      mutation conversationsReplyFacebookComment(
        $conversationId: String
        $commentId: String
        $content: String
      ) {
        conversationsReplyFacebookComment(
          conversationId: $conversationId
          commentId: $commentId
          content: $content
        ) {
          conversationId
          commentId
        }
      }
    `;

    let mock = sinon.stub(messageBroker, 'sendMessage').callsFake(() => {
      return Promise.resolve('success');
    });
    const message = await conversationMessageFactory({ conversationId: facebookConversation._id });
    const comment = await integrationFactory({ kind: 'facebook-post' });

    const args = {
      conversationId: facebookConversation._id,
      content: message.content,
      commentId: comment._id,
    };

    const response = await graphqlRequest(commentMutation, 'conversationsReplyFacebookComment', args, {
      dataSources: {},
    });

    expect(response).toBeDefined();

    mock.restore();

    mock = sinon.stub(messageBroker, 'sendMessage').callsFake(() => {
      throw new Error();
    });

    try {
      await graphqlRequest(commentMutation, 'conversationsReplyFacebookComment', args, {
        dataSources: {},
      });
    } catch (e) {
      expect(e).toBeDefined();
    }
  });

  test('Assign conversation', async () => {
    process.env.DEFAULT_EMAIL_SERIVCE = ' ';
    process.env.COMPANY_EMAIL_FROM = ' ';

    const args = {
      conversationIds: [leadConversation._id],
      assignedUserId: user._id,
    };

    const mutation = `
      mutation conversationsAssign(
        $conversationIds: [String]!
        $assignedUserId: String
      ) {
        conversationsAssign(
          conversationIds: $conversationIds
          assignedUserId: $assignedUserId
        ) {
          assignedUser {
            _id
          }
        }
      }
    `;

    const [conversation] = await graphqlRequest(mutation, 'conversationsAssign', args);

    expect(conversation.assignedUser._id).toEqual(args.assignedUserId);
  });

  test('Unassign conversation', async () => {
    const mutation = `
      mutation conversationsUnassign($_ids: [String]!) {
        conversationsUnassign(_ids: $_ids) {
          assignedUser {
            _id
          }
        }
      }
    `;

    const [conversation] = await graphqlRequest(
      mutation,
      'conversationsUnassign',
      {
        _ids: [leadConversation._id],
      },
      { user },
    );

    expect(conversation.assignedUser).toBe(null);
  });

  test('Change conversation status', async () => {
    process.env.DEFAULT_EMAIL_SERIVCE = ' ';
    process.env.COMPANY_EMAIL_FROM = ' ';

    const args = {
      _ids: [leadConversation._id, messengerConversation._id],
      status: 'closed',
    };

    const mutation = `
      mutation conversationsChangeStatus($_ids: [String]!, $status: String!) {
        conversationsChangeStatus(_ids: $_ids, status: $status) {
          status
        }
      }
    `;

    const [conversation] = await graphqlRequest(mutation, 'conversationsChangeStatus', args);

    expect(conversation.status).toEqual(args.status);

    // if status is not closed
    args.status = CONVERSATION_STATUSES.OPEN;

    const [openConversation] = await graphqlRequest(mutation, 'conversationsChangeStatus', args);

    expect(openConversation.status).toEqual(args.status);
  });

  test('Mark conversation as read', async () => {
    process.env.DEFAULT_EMAIL_SERIVCE = ' ';
    process.env.COMPANY_EMAIL_FROM = ' ';

    const mutation = `
      mutation conversationMarkAsRead($_id: String) {
        conversationMarkAsRead(_id: $_id) {
          _id
          readUserIds
        }
      }
    `;

    const conversation = await graphqlRequest(
      mutation,
      'conversationMarkAsRead',
      { _id: leadConversation._id },
      { user },
    );

    expect(conversation.readUserIds).toContain(user._id);
  });

  test('Delete video chat room', async () => {
    const mutation = `
      mutation conversationDeleteVideoChatRoom($name: String!) {
        conversationDeleteVideoChatRoom(name: $name)
      }
    `;

    try {
      await graphqlRequest(mutation, 'conversationDeleteVideoChatRoom', { name: 'fakeId' }, { dataSources });
    } catch (e) {
      expect(e[0].message).toBe('Integrations api is not running');
    }

    const mock = sinon.stub(dataSources.IntegrationsAPI, 'deleteDailyVideoChatRoom').callsFake(() => {
      return Promise.resolve(true);
    });

    mock.restore();
  });

  test('Create video chat room', async () => {
    const mutation = `
      mutation conversationCreateVideoChatRoom($_id: String!) {
        conversationCreateVideoChatRoom(_id: $_id) {
          url
          name
          status
        }
      }
    `;

    const conversation = await conversationFactory();

    try {
      await graphqlRequest(mutation, 'conversationCreateVideoChatRoom', { _id: conversation._id }, { dataSources });
    } catch (e) {
      expect(e[0].message).toBe('Integrations api is not running');
    }

    const mock = sinon.stub(dataSources.IntegrationsAPI, 'createDailyVideoChatRoom').callsFake(() => {
      return Promise.resolve({ status: 'ongoing' });
    });

    const response = await graphqlRequest(
      mutation,
      'conversationCreateVideoChatRoom',
      { _id: conversation._id },
      { dataSources },
    );

    expect(response.status).toBe('ongoing');

    mock.restore();
  });
});
