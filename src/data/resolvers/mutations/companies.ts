import { Companies } from '../../../db/models';
import { ICompany } from '../../../db/models/definitions/companies';
import { checkPermission } from '../../permissions/wrappers';
import { IContext } from '../../types';
import { putCreateLog, putDeleteLog, putUpdateLog } from '../../utils';

interface ICompaniesEdit extends ICompany {
  _id: string;
}

const companyMutations = {
  /**
   * Create new company also adds Company registration log
   */
  async companiesAdd(_root, doc: ICompany, { user, docModifier, ipAddress }: IContext) {
    const company = await Companies.createCompany(docModifier(doc), user);

    await putCreateLog(
      {
        type: 'company',
        newData: JSON.stringify(doc),
        object: company,
        description: `${company.primaryName} has been created`,
        ipAddress,
      },
      user,
    );

    return company;
  },

  /**
   * Updates a company
   */
  async companiesEdit(_root, { _id, ...doc }: ICompaniesEdit, { user, ipAddress }: IContext) {
    const company = await Companies.getCompany(_id);
    const updated = await Companies.updateCompany(_id, doc);

    await putUpdateLog(
      {
        type: 'company',
        object: company,
        newData: JSON.stringify(doc),
        description: `${company.primaryName} has been updated`,
        ipAddress,
      },
      user,
    );

    return updated;
  },

  /**
   * Remove companies
   */
  async companiesRemove(_root, { companyIds }: { companyIds: string[] }, { user, ipAddress }: IContext) {
    const companies = await Companies.find({ _id: { $in: companyIds } }, { primaryName: 1 }).lean();

    await Companies.removeCompanies(companyIds);

    for (const company of companies) {
      await putDeleteLog(
        {
          type: 'company',
          object: company,
          description: `${company.primaryName} has been removed`,
          ipAddress,
        },
        user,
      );
    }

    return companyIds;
  },

  /**
   * Merge companies
   */
  async companiesMerge(_root, { companyIds, companyFields }: { companyIds: string[]; companyFields: ICompany }) {
    return Companies.mergeCompanies(companyIds, companyFields);
  },
};

checkPermission(companyMutations, 'companiesAdd', 'companiesAdd');
checkPermission(companyMutations, 'companiesEdit', 'companiesEdit');
checkPermission(companyMutations, 'companiesRemove', 'companiesRemove');
checkPermission(companyMutations, 'companiesMerge', 'companiesMerge');

export default companyMutations;
