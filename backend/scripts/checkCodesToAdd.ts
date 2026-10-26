import * as fs from 'fs';
import * as path from 'path';
import { unspscOfficialDictionary } from '../src/data/unspscTaxonomy';

const requiredCodes = [
  {
    commodityCode: '15101505',
    commodityTitle: 'Diesel fuel',
    classCode: '15101500',
    classTitle: 'Oil and petroleum products',
    familyCode: '15100000',
    familyTitle: 'Fuels',
    segmentCode: '15000000',
    segmentTitle: 'Fuels and Lubricants and Related Products',
    coreBucket: 'Fuel & Power'
  },
  {
    commodityCode: '15101601',
    commodityTitle: 'Bituminous coal',
    classCode: '15101600',
    classTitle: 'Fuel oils and lubricants',
    familyCode: '15100000',
    familyTitle: 'Fuels',
    segmentCode: '15000000',
    segmentTitle: 'Fuels and Lubricants and Related Products',
    coreBucket: 'Fuel & Power'
  },
  {
    commodityCode: '15101612',
    commodityTitle: 'Heavy fuel oils',
    classCode: '15101600',
    classTitle: 'Fuel oils and lubricants',
    familyCode: '15100000',
    familyTitle: 'Fuels',
    segmentCode: '15000000',
    segmentTitle: 'Fuels and Lubricants and Related Products',
    coreBucket: 'Fuel & Power'
  },
  {
    commodityCode: '15121500',
    commodityTitle: 'Lubricating preparations and industrial oils',
    classCode: '15121500',
    classTitle: 'Lubricating preparations',
    familyCode: '15120000',
    familyTitle: 'Lubricants and oils and greases and anti corrosives',
    segmentCode: '15000000',
    segmentTitle: 'Fuels and Lubricants and Related Products',
    coreBucket: 'MRO & Consumables'
  },
  {
    commodityCode: '14111601',
    commodityTitle: 'Paper tubes or cores',
    classCode: '14111600',
    classTitle: 'Novelty and specialty paper products',
    familyCode: '14110000',
    familyTitle: 'Paper products',
    segmentCode: '14000000',
    segmentTitle: 'Paper Materials and Products',
    coreBucket: 'Packaging Materials'
  },
  {
    commodityCode: '24121502',
    commodityTitle: 'Corrugated boxes',
    classCode: '24121500',
    classTitle: 'Packaging boxes and bags and pouches',
    familyCode: '24120000',
    familyTitle: 'Packaging supplies',
    segmentCode: '24000000',
    segmentTitle: 'Material Handling and Conditioning Machinery and Accessories',
    coreBucket: 'Packaging Materials'
  },
  {
    commodityCode: '24121500',
    commodityTitle: 'Industrial packaging covers and sacks',
    classCode: '24121500',
    classTitle: 'Packaging boxes and bags and pouches',
    familyCode: '24120000',
    familyTitle: 'Packaging supplies',
    segmentCode: '24000000',
    segmentTitle: 'Material Handling and Conditioning Machinery and Accessories',
    coreBucket: 'Packaging Materials'
  },
  {
    commodityCode: '24111515',
    commodityTitle: 'Bulk transport bags or FIBC or jumbo bags',
    classCode: '24111500',
    classTitle: 'Bags',
    familyCode: '24110000',
    familyTitle: 'Containers and storage',
    segmentCode: '24000000',
    segmentTitle: 'Material Handling and Conditioning Machinery and Accessories',
    coreBucket: 'Packaging Materials'
  },
  {
    commodityCode: '24101904',
    commodityTitle: 'Pallets',
    classCode: '24101900',
    classTitle: 'Lifting and moving equipment and accessories',
    familyCode: '24100000',
    familyTitle: 'Material handling machinery and equipment',
    segmentCode: '24000000',
    segmentTitle: 'Material Handling and Conditioning Machinery and Accessories',
    coreBucket: 'Material Handling'
  },
  {
    commodityCode: '24141514',
    commodityTitle: 'Bagging machines',
    classCode: '24141500',
    classTitle: 'Industrial packaging machinery',
    familyCode: '24140000',
    familyTitle: 'Packaging machinery',
    segmentCode: '24000000',
    segmentTitle: 'Material Handling and Conditioning Machinery and Accessories',
    coreBucket: 'Plant Machinery'
  },
  {
    commodityCode: '24121512',
    commodityTitle: 'Packaging strapping and tape',
    classCode: '24121500',
    classTitle: 'Packaging boxes and bags and pouches',
    familyCode: '24120000',
    familyTitle: 'Packaging supplies',
    segmentCode: '24000000',
    segmentTitle: 'Material Handling and Conditioning Machinery and Accessories',
    coreBucket: 'Packaging Materials'
  },
  {
    commodityCode: '24101720',
    commodityTitle: 'Conveyor belts and accessories',
    classCode: '24101700',
    classTitle: 'Conveyors and accessories',
    familyCode: '24100000',
    familyTitle: 'Material handling machinery and equipment',
    segmentCode: '24000000',
    segmentTitle: 'Material Handling and Conditioning Machinery and Accessories',
    coreBucket: 'Material Handling'
  },
  {
    commodityCode: '23131506',
    commodityTitle: 'Yarn texturing machines',
    classCode: '23131500',
    classTitle: 'Textile spinning and winding and twisting and texturising machinery',
    familyCode: '23130000',
    familyTitle: 'Textile and fabric machinery and accessories',
    segmentCode: '23000000',
    segmentTitle: 'Industrial Manufacturing and Processing Machinery and Accessories',
    coreBucket: 'Plant Machinery'
  },
  {
    commodityCode: '23153100',
    commodityTitle: 'Grinding and crushing media balls and cylinders',
    classCode: '23153100',
    classTitle: 'Grinding and crushing media balls and cylinders',
    familyCode: '23150000',
    familyTitle: 'Industrial process machinery',
    segmentCode: '23000000',
    segmentTitle: 'Industrial Manufacturing and Processing Machinery and Accessories',
    coreBucket: 'Direct Materials'
  },
  {
    commodityCode: '25172500',
    commodityTitle: 'Tires and tubes',
    classCode: '25172500',
    classTitle: 'Tires and tubes',
    familyCode: '25170000',
    familyTitle: 'Transportation components and systems',
    segmentCode: '25000000',
    segmentTitle: 'Commercial and Military and Private Vehicles and their Accessories and Components',
    coreBucket: 'Vehicle Spares'
  },
  {
    commodityCode: '12131700',
    commodityTitle: 'Explosive materials and blasting accessories',
    classCode: '12131700',
    classTitle: 'Explosive materials and blasting accessories',
    familyCode: '12130000',
    familyTitle: 'Explosive materials',
    segmentCode: '12000000',
    segmentTitle: 'Chemicals including Bio Chemicals and Gas Materials',
    coreBucket: 'Mining Consumables'
  },
  {
    commodityCode: '30161500',
    commodityTitle: 'Refractory materials and kiln bricks',
    classCode: '30161500',
    classTitle: 'Refractory materials and kiln bricks',
    familyCode: '30160000',
    familyTitle: 'Interior finishing materials',
    segmentCode: '30000000',
    segmentTitle: 'Structures and Building and Construction and Manufacturing Components',
    coreBucket: 'Plant Maintenance'
  },
  {
    commodityCode: '30101704',
    commodityTitle: 'Mild steel plate and sheet',
    classCode: '30101700',
    classTitle: 'Structural steel sheets and plates',
    familyCode: '30100000',
    familyTitle: 'Structural materials',
    segmentCode: '30000000',
    segmentTitle: 'Structures and Building and Construction and Manufacturing Components',
    coreBucket: 'MRO & Consumables'
  },
  {
    commodityCode: '31171500',
    commodityTitle: 'Bearings and bushings',
    classCode: '31171500',
    classTitle: 'Bearings and bushings',
    familyCode: '31170000',
    familyTitle: 'Bearings and bushings and wheels and gears',
    segmentCode: '31000000',
    segmentTitle: 'Manufacturing and Processing Machinery and Accessories',
    coreBucket: 'MRO & Consumables'
  },
  {
    commodityCode: '31171701',
    commodityTitle: 'Gears and gearboxes and girth gears',
    classCode: '31171700',
    classTitle: 'Gears',
    familyCode: '31170000',
    familyTitle: 'Bearings and bushings and wheels and gears',
    segmentCode: '31000000',
    segmentTitle: 'Manufacturing and Processing Machinery and Accessories',
    coreBucket: 'MRO & Consumables'
  },
  {
    commodityCode: '31161500',
    commodityTitle: 'Fasteners and hardware',
    classCode: '31161500',
    classTitle: 'Fasteners',
    familyCode: '31160000',
    familyTitle: 'Hardware',
    segmentCode: '31000000',
    segmentTitle: 'Manufacturing and Processing Machinery and Accessories',
    coreBucket: 'MRO & Consumables'
  },
  {
    commodityCode: '31401500',
    commodityTitle: 'Seals and gaskets and packings',
    classCode: '31401500',
    classTitle: 'Gaskets and seals',
    familyCode: '31400000',
    familyTitle: 'Gaskets and seals',
    segmentCode: '31000000',
    segmentTitle: 'Manufacturing and Processing Machinery and Accessories',
    coreBucket: 'MRO & Consumables'
  },
  {
    commodityCode: '40101827',
    commodityTitle: 'Thermal fluid heaters',
    classCode: '40101800',
    classTitle: 'Industrial boilers and thermal heaters',
    familyCode: '40100000',
    familyTitle: 'Heating and ventilation and air circulation',
    segmentCode: '40000000',
    segmentTitle: 'Distribution and Conditioning Systems and Equipment and Components',
    coreBucket: 'Plant Machinery'
  },
  {
    commodityCode: '40101701',
    commodityTitle: 'Air conditioning units and industrial air washers',
    classCode: '40101700',
    classTitle: 'Cooling systems and accessories',
    familyCode: '40100000',
    familyTitle: 'Heating and ventilation and air circulation',
    segmentCode: '40000000',
    segmentTitle: 'Distribution and Conditioning Systems and Equipment and Components',
    coreBucket: 'Plant Machinery'
  },
  {
    commodityCode: '40141600',
    commodityTitle: 'Valves',
    classCode: '40141600',
    classTitle: 'Valves',
    familyCode: '40140000',
    familyTitle: 'Fluid and gas flow and filtration',
    segmentCode: '40000000',
    segmentTitle: 'Distribution and Conditioning Systems and Equipment and Components',
    coreBucket: 'MRO & Consumables'
  },
  {
    commodityCode: '40151500',
    commodityTitle: 'Pumps and compressors',
    classCode: '40151500',
    classTitle: 'Pumps',
    familyCode: '40150000',
    familyTitle: 'Industrial pumps and compressors',
    segmentCode: '40000000',
    segmentTitle: 'Distribution and Conditioning Systems and Equipment and Components',
    coreBucket: 'MRO & Consumables'
  },
  {
    commodityCode: '40161500',
    commodityTitle: 'Industrial filtration equipment and media',
    classCode: '40161500',
    classTitle: 'Filtering and purifying machinery and equipment',
    familyCode: '40160000',
    familyTitle: 'Industrial filtering and purification',
    segmentCode: '40000000',
    segmentTitle: 'Distribution and Conditioning Systems and Equipment and Components',
    coreBucket: 'Plant Maintenance'
  },
  {
    commodityCode: '40171501',
    commodityTitle: 'Industrial pipe and pipe fittings',
    classCode: '40171500',
    classTitle: 'Industrial pipe and fittings',
    familyCode: '40170000',
    familyTitle: 'Pipe and tubing and accessories',
    segmentCode: '40000000',
    segmentTitle: 'Distribution and Conditioning Systems and Equipment and Components',
    coreBucket: 'MRO & Consumables'
  },
  {
    commodityCode: '41111900',
    commodityTitle: 'Industrial measuring and observing instruments',
    classCode: '41111900',
    classTitle: 'Pressure measuring instruments',
    familyCode: '41110000',
    familyTitle: 'Measuring and observing and testing instruments',
    segmentCode: '41000000',
    segmentTitle: 'Laboratory and Measuring and Observing and Testing Equipment',
    coreBucket: 'Instrumentation'
  },
  {
    commodityCode: '26121600',
    commodityTitle: 'Electrical wire and cable and harness',
    classCode: '26121600',
    classTitle: 'Electrical cable and wire',
    familyCode: '26120000',
    familyTitle: 'Electrical wire and cable and harness',
    segmentCode: '26000000',
    segmentTitle: 'Power Generation and Distribution Machinery and Accessories',
    coreBucket: 'Electrical Spares'
  },
  {
    commodityCode: '26101100',
    commodityTitle: 'Electric motors and generators',
    classCode: '26101100',
    classTitle: 'Motors and generators',
    familyCode: '26100000',
    familyTitle: 'Power sources',
    segmentCode: '26000000',
    segmentTitle: 'Power Generation and Distribution Machinery and Accessories',
    coreBucket: 'Electrical Spares'
  },
  {
    commodityCode: '46181500',
    commodityTitle: 'Safety apparel and personal protective equipment (PPE)',
    classCode: '46181500',
    classTitle: 'Safety apparel',
    familyCode: '46180000',
    familyTitle: 'Personal safety and protection',
    segmentCode: '46000000',
    segmentTitle: 'Defense and Law Enforcement and Security and Safety Equipment and Supplies',
    coreBucket: 'Safety & PPE'
  },
  {
    commodityCode: '72102900',
    commodityTitle: 'Industrial plant maintenance and fabrication services',
    classCode: '72102900',
    classTitle: 'Facility maintenance and repair services',
    familyCode: '72100000',
    familyTitle: 'Building and facility maintenance',
    segmentCode: '72000000',
    segmentTitle: 'Building and Construction and Maintenance Services',
    coreBucket: 'Services'
  },
  {
    commodityCode: '72151500',
    commodityTitle: 'Electrical system installation and maintenance services',
    classCode: '72151500',
    classTitle: 'Electrical system services',
    familyCode: '72150000',
    familyTitle: 'Specialized trade construction and maintenance services',
    segmentCode: '72000000',
    segmentTitle: 'Building and Construction and Maintenance Services',
    coreBucket: 'Services'
  },
  {
    commodityCode: '78101800',
    commodityTitle: 'Freight transport and storage and equipment rental services',
    classCode: '78101800',
    classTitle: 'Logistics and handling services',
    familyCode: '78100000',
    familyTitle: 'Mail and cargo transport',
    segmentCode: '78000000',
    segmentTitle: 'Transportation and Storage and Mail Services',
    coreBucket: 'Logistics'
  },
  {
    commodityCode: '80111600',
    commodityTitle: 'Temporary personnel services and contract labor',
    classCode: '80111600',
    classTitle: 'Temporary personnel services',
    familyCode: '80110000',
    familyTitle: 'Human resources services',
    segmentCode: '80000000',
    segmentTitle: 'Management and Business Professionals and Administrative Services',
    coreBucket: 'Services'
  }
];

const existingCodes = new Set(unspscOfficialDictionary.map(r => r.commodityCode));
const toAdd = requiredCodes.filter(r => !existingCodes.has(r.commodityCode));
console.log(`Already in dictionary: ${requiredCodes.length - toAdd.length}`);
console.log(`To add to dictionary: ${toAdd.length}`);
for (const item of toAdd) {
  console.log(`  + ${item.commodityCode}: ${item.commodityTitle} (${item.classTitle})`);
}
