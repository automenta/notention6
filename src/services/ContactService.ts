import { Contact } from "../../shared/types";
import { DBService } from "./db";

class ContactService {
  async getContacts(): Promise<Contact[]> {
    let contacts = await DBService.getContacts();
    if (!contacts) {
      contacts = [];
    }
    return contacts;
  }

  async addContact(contact: Contact): Promise<void> {
    const contacts = await this.getContacts();
    if (contacts.find((c) => c.pubkey === contact.pubkey)) {
      return; // Contact already exists
    }
    const newContacts = [...contacts, contact];
    await DBService.saveContacts(newContacts);
  }

  async removeContact(pubkey: string): Promise<void> {
    const contacts = await this.getContacts();
    const newContacts = contacts.filter((c) => c.pubkey !== pubkey);
    await DBService.saveContacts(newContacts);
  }

  async fetchContactsFromNostr() {
    // This will be implemented later
  }
}

export const contactService = new ContactService();
