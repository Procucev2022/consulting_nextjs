import { setProcurementCategoryMappings } from '../src/utils/procurementCategoryResolver';
import { getD1CategoryMappingsFixture } from '../../tests/fixtures/d1CategoryMappings';

setProcurementCategoryMappings(getD1CategoryMappingsFixture());
