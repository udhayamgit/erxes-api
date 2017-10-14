import { Companies } from '../../../db/models';

export default {
  /**
   * Create new company
   * @return {Promise} company object
   */
  companiesAdd(root, doc, { user }) {
    if (!user) throw new Error('Login required');

    return Companies.createCompany(doc);
  },

  /**
   * Update company
   * @return {Promise} company object
   */
  async companiesEdit(root, { _id, ...doc }, { user }) {
    if (!user) throw new Error('Login required');

    return Companies.updateCompany(_id, doc);
  },

  /**
   * Add new companyId to company's companyIds list
   * @param {Object} args - Graphql input data
   * @param {String} args._id - Customer id
   * @param {String} args.name - Customer name
   * @param {String} args.email - Customer email
   * @return {Promise} newly created customer
   */
  async companiesAddCustomer(root, args, { user }) {
    if (!user) throw new Error('Login required');

    return Companies.addCustomer(args);
  },
};
