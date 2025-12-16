import Agent from '../../../models/Agent';
import { TestFactory } from '../../helpers/factories';

describe('Agent Model', () => {
  describe('Creation', () => {
    it('should create an agent with valid data', async () => {
      const district = await TestFactory.createDistrict();

      const agent = await Agent.create({
        agentId: 'AG123456',
        firstName: 'Ahmed',
        lastName: 'BENALI',
        email: 'ahmed.benali@ree.ma',
        phone: '+212 661234567',
        districtId: district.id,
        isActive: true,
      });

      expect(agent.id).toBeDefined();
      expect(agent.agentId).toBe('AG123456');
      expect(agent.firstName).toBe('Ahmed');
      expect(agent.lastName).toBe('BENALI');
      expect(agent.email).toBe('ahmed.benali@ree.ma');
      expect(agent.phone).toBe('+212 661234567');
      expect(agent.districtId).toBe(district.id);
      expect(agent.isActive).toBe(true);
    });

    it('should auto-generate agentId if not provided', async () => {
      const district = await TestFactory.createDistrict();

      const agent = await Agent.create({
        firstName: 'Ahmed',
        lastName: 'BENALI',
        email: 'ahmed@ree.ma',
        phone: '+212 661234567',
        districtId: district.id,
      });

      expect(agent.agentId).toBeDefined();
      expect(typeof agent.agentId).toBe('string');
    });

    it('should fail to create agent without districtId', async () => {
      await expect(
        Agent.create({
          agentId: 'AG123',
          firstName: 'Test',
          lastName: 'AGENT',
          email: 'test@ree.ma',
          phone: '+212 661234567',
        } as any)
      ).rejects.toThrow();
    });

    it('should fail to create agent with duplicate agentId', async () => {
      const district = await TestFactory.createDistrict();
      const agentId = 'DUPLICATE123';

      await TestFactory.createAgent({ agentId, districtId: district.id });

      await expect(
        TestFactory.createAgent({ agentId, districtId: district.id })
      ).rejects.toThrow();
    });

    it('should fail to create agent with duplicate email', async () => {
      const email = 'duplicate@ree.ma';
      await TestFactory.createAgent({ email });

      await expect(
        TestFactory.createAgent({ email })
      ).rejects.toThrow();
    });

    it('should set default isActive to true', async () => {
      const agent = await TestFactory.createAgent();
      expect(agent.isActive).toBe(true);
    });
  });

  describe('Validation', () => {
    it('should validate email format', async () => {
      const district = await TestFactory.createDistrict();

      await expect(
        Agent.create({
          agentId: 'AG123',
          firstName: 'Test',
          lastName: 'AGENT',
          email: 'invalid-email',
          phone: '+212 661234567',
          districtId: district.id,
        })
      ).rejects.toThrow();
    });

    it('should require firstName', async () => {
      const district = await TestFactory.createDistrict();

      await expect(
        Agent.create({
          agentId: 'AG123',
          lastName: 'AGENT',
          email: 'test@ree.ma',
          phone: '+212 661234567',
          districtId: district.id,
        } as any)
      ).rejects.toThrow();
    });

    it('should require lastName', async () => {
      const district = await TestFactory.createDistrict();

      await expect(
        Agent.create({
          agentId: 'AG123',
          firstName: 'Test',
          email: 'test@ree.ma',
          phone: '+212 661234567',
          districtId: district.id,
        } as any)
      ).rejects.toThrow();
    });
  });

  describe('Update', () => {
    it('should update agent data', async () => {
      const agent = await TestFactory.createAgent();
      const newEmail = 'newemail@ree.ma';

      await agent.update({ email: newEmail });
      await agent.reload();

      expect(agent.email).toBe(newEmail);
    });

    it('should update agent phone', async () => {
      const agent = await TestFactory.createAgent();
      const newPhone = '+212 699999999';

      await agent.update({ phone: newPhone });
      await agent.reload();

      expect(agent.phone).toBe(newPhone);
    });

    it('should change agent district', async () => {
      const agent = await TestFactory.createAgent();
      const newDistrict = await TestFactory.createDistrict();

      await agent.update({ districtId: newDistrict.id });
      await agent.reload();

      expect(agent.districtId).toBe(newDistrict.id);
    });

    it('should deactivate agent', async () => {
      const agent = await TestFactory.createAgent({ isActive: true });

      await agent.update({ isActive: false });
      await agent.reload();

      expect(agent.isActive).toBe(false);
    });
  });

  describe('Associations', () => {
    it('should load district association', async () => {
      const agent = await TestFactory.createAgent();
      const agentWithDistrict = await Agent.findByPk(agent.id, {
        include: ['district'],
      });

      expect(agentWithDistrict?.district).toBeDefined();
      expect(agentWithDistrict?.district?.id).toBe(agent.districtId);
    });

    it('should load readings association', async () => {
      const agent = await TestFactory.createAgent();
      await TestFactory.createReading({ agentId: agent.id });
      await TestFactory.createReading({ agentId: agent.id });

      const agentWithReadings = await Agent.findByPk(agent.id, {
        include: ['readings'],
      });

      expect(agentWithReadings?.readings).toBeDefined();
      expect(agentWithReadings?.readings?.length).toBe(2);
    });
  });

  describe('Query', () => {
    it('should find agents by districtId', async () => {
      const district = await TestFactory.createDistrict();

      await TestFactory.createAgent({ districtId: district.id });
      await TestFactory.createAgent({ districtId: district.id });

      const agents = await Agent.findAll({
        where: { districtId: district.id },
      });

      expect(agents.length).toBe(2);
    });

    it('should find active agents', async () => {
      await TestFactory.createAgent({ isActive: true });
      await TestFactory.createAgent({ isActive: true });
      await TestFactory.createAgent({ isActive: false });

      const activeAgents = await Agent.findAll({
        where: { isActive: true },
      });

      expect(activeAgents.length).toBe(2);
    });

    it('should find agent by agentId', async () => {
      const agent = await TestFactory.createAgent({ agentId: 'FINDME123' });

      const foundAgent = await Agent.findOne({
        where: { agentId: 'FINDME123' },
      });

      expect(foundAgent).toBeDefined();
      expect(foundAgent?.id).toBe(agent.id);
    });

    it('should find agent by email', async () => {
      const email = 'findme@ree.ma';
      const agent = await TestFactory.createAgent({ email });

      const foundAgent = await Agent.findOne({
        where: { email },
      });

      expect(foundAgent).toBeDefined();
      expect(foundAgent?.id).toBe(agent.id);
    });
  });

  describe('Deletion', () => {
    it('should delete an agent', async () => {
      const agent = await TestFactory.createAgent();
      const agentId = agent.id;

      await agent.destroy();

      const deletedAgent = await Agent.findByPk(agentId);
      expect(deletedAgent).toBeNull();
    });
  });
});
