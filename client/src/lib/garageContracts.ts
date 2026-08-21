export type GarageRouteContract = {
  id: string;
  name: string;
  location: string;
  ownerFirstName: string;
  ownerLastName: string;
  contact: string;
};

export const garageRouteContracts: Record<string, GarageRouteContract> = {
  "garage-central": { id: "garage-central", name: "Garage Central", location: "Brazzaville · Moungali", ownerFirstName: "Koffi", ownerLastName: "N'Guessan", contact: "koffi.ng@example.com" },
  "garage-ivoire": { id: "garage-ivoire", name: "Ivoire Auto Service", location: "Pointe-Noire · Loandjili", ownerFirstName: "Jean", ownerLastName: "Bamba", contact: "+242 06 987 65 43" },
  "garage-modern": { id: "garage-modern", name: "Modern Motors", location: "Dolisie · Centre-ville", ownerFirstName: "Patrick", ownerLastName: "Mabiala", contact: "patrick.mabiala@example.com" },
  "garage-express": { id: "garage-express", name: "Express Mécanique", location: "Brazzaville · Talangaï", ownerFirstName: "Clarisse", ownerLastName: "Mvoula", contact: "+242 05 441 22 10" },
  "garage-elite": { id: "garage-elite", name: "Elite Car Care", location: "Pointe-Noire · Tié-Tié", ownerFirstName: "Armand", ownerLastName: "Ngoma", contact: "armand.ngoma@example.com" },
};

export function getGarageRouteContract(id: string) {
  return garageRouteContracts[id];
}
