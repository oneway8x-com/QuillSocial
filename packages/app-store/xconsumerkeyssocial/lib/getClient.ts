import { xconsumerkeysCredentialSchema } from "./credentialSchema";
import { symmetricDecrypt } from "@quillsocial/lib/crypto";
import prisma from "@quillsocial/prisma";
import { TwitterApi } from "twitter-api-v2";
import { z } from "zod";

export const getXConsumerKeysClient = async (credentialId: number) => {
  const credential = await prisma.credential.findUnique({
    where: {
      id: credentialId,
    },
  });

  if (!credential) {
    return { client: null };
  }

  try {
    // Decrypt the stored API keys
    const decryptedKey = symmetricDecrypt(
      credential.key as string,
      process.env.MY_APP_ENCRYPTION_KEY || ""
    );

    const decryptedData = JSON.parse(decryptedKey);

    const parsedCredential = xconsumerkeysCredentialSchema.parse(decryptedData);

    // Create Twitter client using OAuth 1.0a with Consumer Keys and User Access Tokens
    const clientConfig: any = {
      appKey: parsedCredential.apiKey,
      appSecret: parsedCredential.secret,
    };

    // If user access tokens are provided, include them for posting capabilities
    if (
      parsedCredential.accessToken &&
      parsedCredential.accessSecret &&
      parsedCredential.accessToken.trim() !== "" &&
      parsedCredential.accessSecret.trim() !== ""
    ) {
      clientConfig.accessToken = parsedCredential.accessToken;
      clientConfig.accessSecret = parsedCredential.accessSecret;
    }
    console.log(parsedCredential);
    const clientApi = new TwitterApi({
      appKey: parsedCredential.apiKey, // API Key
      appSecret: parsedCredential.secret, // API Secret Key
      accessToken: parsedCredential.accessToken, // Access Token
      accessSecret: parsedCredential.accessSecret, // Access Token Secret
    });

    const client = clientApi.readWrite.v2;
    // const me = await clientApi.readWrite.currentUser();
    // console.log("Logged in as:", me);
    // await clientApi.readWrite.v2.tweet("Hello from v2 🚀");

    return { client, credentials: parsedCredential, userId: credential.userId };
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error("Credential validation failed:", error.errors);
    } else {
      console.error("Error creating X client with consumer keys:", error);
    }
    return { client: null };
  }
};
