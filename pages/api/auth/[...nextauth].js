import NextAuth from "next-auth";
import AzureADProvider from "next-auth/providers/azure-ad";

export default NextAuth({
  providers: [
    AzureADProvider({
      clientId: process.env.AZURE_AD_CLIENT_ID,
      clientSecret: process.env.AZURE_AD_CLIENT_SECRET,
      tenantId: process.env.AZURE_AD_TENANT_ID,
      authorization: {
        params: {
          scope: "openid profile email Calendars.Read User.Read offline_access",
        },
      },
    }),
  ],
  callbacks: {
    async signIn({ account, profile }) {
      if (account?.provider === "azure-ad") {
        return true;
      }
      return false;
    },
    async jwt({ token, account }) {
      if (account) {
        token.accessToken = account.access_token;
      }
      return token;
    },
    async session({ session, token }) {
      session.accessToken = token.accessToken;
      return session;
    },
  },

  secret: process.env.NEXTAUTH_SECRET,
});
