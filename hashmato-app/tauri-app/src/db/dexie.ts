import Dexie, { Table } from "dexie";
import { AppMenuItem, LocalOrder } from "../types";

export class HashmatoDB extends Dexie {
  menu!: Table<AppMenuItem, number>;
  orders!: Table<LocalOrder, number>;

  constructor() {
    super("hashmato");
    this.version(1).stores({
      menu: "id, updated_at",
      orders: "++id, source, status, synced, created_at, updated_at",
    });
  }
}

export const db = new HashmatoDB();
