import { conformityQueryFields } from './common';

// TODO: remove customer's email and phone field after customCommand

export const types = `
  type CustomerConnectionChangedResponse {
    _id: String!
    status: String!
  }

  type CustomerLinks {
    linkedIn: String
    twitter: String
    facebook: String
    youtube: String
    github: String
    website: String
  }

  type Customer {
    _id: String!
    state: String
    createdAt: Date
    modifiedAt: Date
    avatar: String
    integrationId: String
    firstName: String
    lastName: String
    birthDate: Date
    sex: Int

    email: String
    primaryEmail: String
    emails: [String]
    primaryPhone: String
    phones: [String]

    phone: String
    tagIds: [String]
    remoteAddress: String
    internalNotes: JSON
    location: JSON
    visitorContactInfo: JSON
    customFieldsData: JSON
    trackedData: JSON
    ownerId: String
    position: String
    department: String
    leadStatus: String
    hasAuthority: String
    description: String
    doNotDisturb: String
    code: String
    emailValidationStatus: String

    isOnline: Boolean
    lastSeenAt: Date
    sessionCount: Int

    integration: Integration
    links: CustomerLinks
    companies: [Company]
    conversations: [Conversation]
    getTrackedData: JSON
    getTags: [Tag]
    owner: User
  }

  type CustomersListResponse {
    list: [Customer],
    totalCount: Float,
  }
`;

const queryParams = `
  page: Int
  perPage: Int
  segment: String
  type: String
  tag: String
  ids: [String]
  searchValue: String
  brand: String
  integration: String
  form: String
  startDate: String
  endDate: String
  leadStatus: String
  sortField: String
  sortDirection: Int
  sex:Int
  birthDate: Date
  ${conformityQueryFields}
`;

export const queries = `
  customersMain(${queryParams}): CustomersListResponse
  customers(${queryParams}): [Customer]
  customerCounts(${queryParams}, only: String): JSON
  customerDetail(_id: String!): Customer
`;

const fields = `
  avatar: String
  firstName: String
  lastName: String
  primaryEmail: String
  emails: [String]
  primaryPhone: String
  phones: [String]
  ownerId: String
  position: String
  department: String
  leadStatus: String
  hasAuthority: String
  description: String
  doNotDisturb: String
  links: JSON
  customFieldsData: JSON
  code: String
  sex: Int
  birthDate: Date
`;

export const mutations = `
  customersAdd(state: String, ${fields}): Customer
  customersEdit(_id: String!, ${fields}): Customer
  customersMerge(customerIds: [String], customerFields: JSON): Customer
  customersRemove(customerIds: [String]): [String]
  customersChangeState(_id: String!, value: String!): Customer
`;
