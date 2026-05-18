import {
  getExternalHouses,
  getInternalHouses,
  getPublicHouseGroups,
  type House,
  type PublicHouseGroups,
} from "@/lib/houses";

async function assertPhaseOneHouseSourceHelpers() {
  const externalHouses: House[] = await getExternalHouses();
  const internalHouses: House[] = await getInternalHouses();
  const publicGroups: PublicHouseGroups = await getPublicHouseGroups();
  const groupedExternalHouses: House[] = publicGroups.externalHouses;
  const groupedInternalHouses: House[] = publicGroups.internalHouses;

  void externalHouses;
  void internalHouses;
  void groupedExternalHouses;
  void groupedInternalHouses;
}

void assertPhaseOneHouseSourceHelpers;
