import { Contact } from "../../shared/types";
import { DBService } from "./db";
import { store } from "../store";
import { nostrService } from "./NostrService";

class ContactService {
  async getContacts(): Promise<Contact[]> {
    let contacts = await DBService.getContacts();
    if (!contacts) {
      contacts = [];
    }
    store.getState().setContacts(contacts);
    return contacts;
  }

  async addContact(contact: Contact): Promise<void> {
    const contacts = await this.getContacts();
    if (contacts.find((c) => c.pubkey === contact.pubkey)) {
      return; // Contact already exists
    }
    const newContacts = [...contacts, contact];
    await DBService.saveContacts(newContacts);
    store.getState().setContacts(newContacts);
  }

  async removeContact(pubkey: string): Promise<void> {
    const contacts = await this.getContacts();
    const newContacts = contacts.filter((c) => c.pubkey !== pubkey);
    await DBService.saveContacts(newContacts);
    store.getState().setContacts(newContacts);
  }

  async fetchContactsFromNostr() {
    // This will be implemented later
  }
}

export const contactService = new ContactService();
