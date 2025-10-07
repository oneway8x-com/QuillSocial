import PageWrapper from "@components/PageWrapper";
import TwoFactor from "@components/auth/TwoFactor";
import AuthContainer from "@components/ui/AuthContainer";
import { zodResolver } from "@hookform/resolvers/zod";
import type { inferSSRProps } from "@lib/types/inferSSRProps";
import type { WithNonceProps } from "@lib/withNonce";
import withNonce from "@lib/withNonce";
import { ErrorCode } from "@quillsocial/features/auth/lib/ErrorCode";
import { getServerSession } from "@quillsocial/features/auth/lib/getServerSession";
// import { isSAMLLoginEnabled, samlProductID, samlTenantID } from "@quillsocial/features/ee/sso/lib/saml";
import { WEBAPP_URL } from "@quillsocial/lib/constants";
import { getSafeRedirectUrl } from "@quillsocial/lib/getSafeRedirectUrl";
import { useLocale } from "@quillsocial/lib/hooks/useLocale";
import prisma from "@quillsocial/prisma";
import { Alert, Button, EmailField, PasswordField } from "@quillsocial/ui";
import { ArrowLeft } from "@quillsocial/ui/components/icon";
import { ssrInit } from "@server/lib/ssr";
import classNames from "classnames";
import { jwtVerify } from "jose";
import type { GetServerSidePropsContext } from "next";
import { getCsrfToken, signIn } from "next-auth/react";
import Link from "next/link";
import { useRouter } from "next/router";
import type { CSSProperties } from "react";
import { useState } from "react";
import { FormProvider, useForm } from "react-hook-form";
import { FaGoogle } from "react-icons/fa";
import { z } from "zod";

interface LoginValues {
  email: string;
  password: string;
  totpCode: string;
  csrfToken: string | null;
}
export default function Login({
  csrfToken,
  isGoogleLoginEnabled,
  // isSAMLLoginEnabled,
  // samlTenantID,
  // samlProductID,
  totpEmail,
}: inferSSRProps<typeof _getServerSideProps> & WithNonceProps) {
  const { t } = useLocale();
  const router = useRouter();
  const formSchema = z
    .object({
      email: z
        .string()
        .min(1, `${t("error_required_field")}`)
        .email(`${t("enter_valid_email")}`),
      password: z.string().min(1, `${t("error_required_field")}`),
    })
    // Passthrough other fields like totpCode
    .passthrough();
  const methods = useForm<LoginValues>({ resolver: zodResolver(formSchema) });
  const { register, formState } = methods;
  const [twoFactorRequired, setTwoFactorRequired] = useState(
    !!totpEmail || false
  );
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const errorMessages: { [key: string]: string } = {
    // [ErrorCode.SecondFactorRequired]: t("2fa_enabled_instructions"),
    // Don't leak information about whether an email is registered or not
    [ErrorCode.IncorrectUsernamePassword]: t("incorrect_username_password"),
    [ErrorCode.IncorrectTwoFactorCode]: `${t("incorrect_2fa_code")} ${t(
      "please_try_again"
    )}`,
    [ErrorCode.InternalServerError]: `${t("something_went_wrong")} ${t(
      "please_try_again_and_contact_us"
    )}`,
    [ErrorCode.ThirdPartyIdentityProviderEnabled]: t(
      "account_created_with_identity_provider"
    ),
  };

  let callbackUrl =
    typeof router.query?.callbackUrl === "string"
      ? router.query.callbackUrl
      : "";

  if (/"\//.test(callbackUrl)) callbackUrl = callbackUrl.substring(1);

  // If not absolute URL, make it absolute
  if (!/^https?:\/\//.test(callbackUrl)) {
    callbackUrl = `${WEBAPP_URL}/${callbackUrl}`;
  }

  const safeCallbackUrl = getSafeRedirectUrl(callbackUrl);

  callbackUrl = safeCallbackUrl || "";

  const LoginFooter = (
    <a href={`${WEBAPP_URL}/signup`} className="text-brand-500 font-medium">
      Don&apos;t have an account?
    </a>
  );

  const TwoFactorFooter = (
    <Button
      onClick={() => {
        setTwoFactorRequired(false);
        methods.setValue("totpCode", "");
      }}
      StartIcon={ArrowLeft}
      color="minimal"
    >
      Go back
    </Button>
  );

  const ExternalTotpFooter = (
    <Button
      onClick={() => {
        window.location.replace("/");
      }}
      color="minimal"
    >
      Cancel
    </Button>
  );

  const onSubmit = async (values: LoginValues) => {
    setErrorMessage(null);
    const res = await signIn<"credentials">("credentials", {
      ...values,
      callbackUrl,
      redirect: false,
    });
    if (!res) setErrorMessage(errorMessages[ErrorCode.InternalServerError]);
    // we're logged in! let's do a hard refresh to the desired url
    else if (!res.error) router.push(callbackUrl);
    // reveal two factor input if required
    else if (res.error === ErrorCode.SecondFactorRequired)
      setTwoFactorRequired(true);
    // fallback if error not found
    else setErrorMessage(errorMessages[res.error] || "Something went wrong.");
  };

  const emailAddress = "Email address";

  return (
    <div
      style={
        {
          "--quill-brand": "#111827",
          "--quill-brand-emphasis": "#101010",
          "--quill-brand-text": "white",
          "--quill-brand-subtle": "#9CA3AF",
        } as CSSProperties
      }
    >
      <AuthContainer
        title={t("login")}
        description={t("login")}
        showLogo
        heading={twoFactorRequired ? t("2fa_code") : "Welcome back"}
        footerText={
          twoFactorRequired
            ? !totpEmail
              ? TwoFactorFooter
              : ExternalTotpFooter
            : process.env.NEXT_PUBLIC_DISABLE_SIGNUP !== "true"
            ? LoginFooter
            : null
        }
      >
        <FormProvider {...methods}>
          <form
            onSubmit={methods.handleSubmit(onSubmit)}
            noValidate
            data-testid="login-form"
          >
            <div>
              <input
                defaultValue={csrfToken || undefined}
                type="hidden"
                hidden
                {...register("csrfToken")}
              />
            </div>
            <div className="space-y-6">
              <div
                className={classNames("space-y-6", {
                  hidden: twoFactorRequired,
                })}
              >
                <EmailField
                  id="email"
                  label={emailAddress}
                  defaultValue={totpEmail || (router.query.email as string)}
                  placeholder="john.doe@example.com"
                  required
                  {...register("email")}
                />
                <div className="relative">
                  <PasswordField
                    id="password"
                    autoComplete="off"
                    required={!totpEmail}
                    className="mb-0"
                    {...register("password")}
                  />
                  <div className="absolute -top-[2px] right-0">
                    <Link
                      href="/auth/forgot-password"
                      tabIndex={-1}
                      className="text-default text-sm font-medium"
                    >
                      {t("forgot")}
                    </Link>
                  </div>
                </div>
              </div>

              {twoFactorRequired && <TwoFactor center />}

              {errorMessage && <Alert severity="error" title={errorMessage} />}
              <Button
                type="submit"
                color="primary"
                disabled={formState.isSubmitting}
                className="w-full justify-center text-white focus:outline-none focus:ring focus:ring-violet-300"
              >
                {twoFactorRequired ? t("submit") : t("sign_in")}
              </Button>
            </div>
          </form>

          <hr className="border-subtle my-8" />
          <div className="space-y-3 text-center">
            <Button
              color="secondary"
              className="w-auto justify-center gap-2 rounded-full"
              data-testid="google"
              onClick={async (e) => {
                e.preventDefault();
                await signIn("google", { callbackUrl: callbackUrl || undefined });
              }}
            >
              <img className="h-6 w-6" src="/img/gg.png" alt="Google" />
              {t("signin_with_google")}
            </Button>
          </div>
          {/* <div className="my-2 space-y-3 text-center">
            <Button
              color="secondary"
              className="w-auto justify-center gap-2 rounded-full"
              data-testid="twitter"
              onClick={async (e) => {
                e.preventDefault();
                await signIn("twitter");
              }}>
              <svg viewBox="0 0 24 24" aria-hidden="true" className="h-6 w-6">
                <g>
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"></path>
                </g>
              </svg>
              Continue with X/Twitter
            </Button>
          </div> */}
          {/* <div className="my-2 space-y-3 text-center">
            <Button
              color="secondary"
              className="w-auto justify-center gap-2 rounded-full"
              data-testid="linked-in"
              onClick={async (e) => {
                e.preventDefault();
                await signIn("linkedin");
              }}>
                <img src={`${WEBAPP_URL}/logo/linkedin-social-logo.svg`} width={24} height={24} />
                Continue with LinkedIn
            </Button>
          </div> */}
        </FormProvider>
      </AuthContainer>
      {/* <AddToHomescreen /> */}
    </div>
  );
}

// TODO: Once we understand how to retrieve prop types automatically from getServerSideProps, remove this temporary variable
const _getServerSideProps = async function getServerSideProps(
  context: GetServerSidePropsContext
) {
  const { req, res } = context;
  const session = await getServerSession({ req, res });
  const ssr = await ssrInit(context);

  const verifyJwt = (jwt: string) => {
    const secret = new TextEncoder().encode(process.env.MY_APP_ENCRYPTION_KEY);

    return jwtVerify(jwt, secret, {
      issuer: WEBAPP_URL,
      audience: `${WEBAPP_URL}/auth/login`,
      algorithms: ["HS256"],
    });
  };

  let totpEmail: string | null = null;
  if (context.query.totp) {
    try {
      const decryptedJwt = await verifyJwt(context.query.totp as string);
      if (decryptedJwt.payload) {
        totpEmail = decryptedJwt.payload.email as string;
      } else {
        return {
          redirect: {
            destination: "/auth/error?error=JWT%20Invalid%20Payload",
            permanent: false,
          },
        };
      }
    } catch (e) {
      return {
        redirect: {
          destination:
            "/auth/error?error=Invalid%20JWT%3A%20Please%20try%20again",
          permanent: false,
        },
      };
    }
  }

  if (session) {
    return {
      redirect: {
        destination: "/",
        permanent: false,
      },
    };
  }

  const userCount = await prisma.user.count();
  if (userCount === 0) {
    // Proceed to new onboarding to create first admin user
    return {
      redirect: {
        destination: "/auth/setup",
        permanent: false,
      },
    };
  }
  const csrfToken = await getCsrfToken(context);
  const isGoogleLoginEnabled = !!process.env.GOOGLE_API_CREDENTIALS && (() => {
    try {
      const parsed = JSON.parse(process.env.GOOGLE_API_CREDENTIALS || "{}");
      return !!(parsed?.web?.client_id && parsed?.web?.client_secret);
    } catch (e) {
      return false;
    }
  })();

  return {
    props: {
      csrfToken: csrfToken || null,
      trpcState: ssr.dehydrate(),
      isGoogleLoginEnabled,
      totpEmail,
    },
  };
};

Login.isThemeSupported = false;
Login.PageWrapper = PageWrapper;

export const getServerSideProps = withNonce(_getServerSideProps);
