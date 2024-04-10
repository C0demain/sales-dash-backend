import { Client } from "../models/Client";

interface IClientRepo {
  save(client: Client): Promise<void>;
  update(client: Client): Promise<void>;
  delete(clientId: number): Promise<void>;
  getById(clientId: number): Promise<Client>;
  getAll(): Promise<Client[]>;

  delete(clientId: number): Promise<void>;
}

export class ClientRepo implements IClientRepo {

  async save(client: Client): Promise<void> {
    try {
      await Client.create({
        name: client.name,
        segment : client.segment,
        cpf : client.cpf,
      });
    } catch (error) {
      throw new Error("Failed to create client!");
    }
  }

  async update(client: Client): Promise<void> {
    try {
      //  find existing client
      const new_client = await Client.findOne({
        where: {
          id: client.id,
        },
      });

      if (!new_client) {
        throw new Error("Client not found");
      }

      await new_client.save();
    } catch (error) {
      throw new Error("Failed to update client!");
    }
  }

  async delete(clientId: number): Promise<void> {
    try {
      // Encontrar o usuário existente
      const client = await Client.findOne({
        where: { id: clientId },
      });
  
      if (!client) {
        throw new Error("User not found");
      }
  
      // Excluir o usuário
      await client.destroy();
    } catch (error) {
      throw new Error("Failed to delete client!");
    }
  }
  

  async getById(clientId: number): Promise<Client> {
    try {
      //  find existing client
      const new_client = await Client.findOne({
        where: {
          id: clientId,
        },
      });

      if (!new_client) {
        throw new Error("Client not found");
      }
      // client data
      return new_client;
    } catch (error) {
      throw new Error("Failed to get client!");
    }
  }

  async getByCpf(clientcpf: string): Promise<Client> {
    try {
      const new_client = await Client.findOne({
        where: {
          cpf: clientcpf,
        },
      });

      if (!new_client) {
        throw new Error("Client not found");
      }
      return new_client;
    } catch (error) {
      throw new Error("Failed to get client!");
    }
  }


  async getAll(): Promise<Client[]> {
    try {
      return await Client.findAll();
    } catch (error) {
      throw new Error("Failed to feacth all client!");
    }
  }

}