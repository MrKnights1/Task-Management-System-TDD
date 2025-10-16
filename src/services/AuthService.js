// Authentication service for managing user sessions
export class AuthService {
  constructor(prisma) {
    this.prisma = prisma;
    this.sessions = new Map();
  }

  generateSessionToken() {
    return Math.random().toString(36).substring(2) + Date.now().toString(36);
  }

  async login(email) {
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user) {
      return null;
    }
    const sessionToken = this.generateSessionToken();
    this.sessions.set(sessionToken, user.id);
    return { user, sessionToken };
  }

  async authenticate(token) {
    if (!token) {
      return null;
    }
    const userId = this.sessions.get(token);
    if (!userId) {
      return null;
    }
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    return user;
  }

  logout(token) {
    this.sessions.delete(token);
  }
}
