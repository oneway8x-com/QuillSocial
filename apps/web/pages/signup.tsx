import { ssrInit } from "../server/lib/ssr";
import PageWrapper from "@components/PageWrapper";
import { XMarkIcon } from "@heroicons/react/24/solid";
import { zodResolver } from "@hookform/resolvers/zod";
import { WEBAPP_URL } from "@quillsocial/lib/constants";
import { useLocale } from "@quillsocial/lib/hooks/useLocale";
import { inferSSRProps } from "@quillsocial/types/inferSSRProps";
import {
  Alert,
  Button,
  EmailField,
  HeadSeo,
  PasswordField,
  TextField,
} from "@quillsocial/ui";
import { Dialog, DialogFooter, DialogContent } from "@quillsocial/ui";
import { GetServerSidePropsContext } from "next";
import { signIn } from "next-auth/react";
import { useSearchParams } from "next/navigation";
import { useRouter } from "next/router";
import React from "react";
import type { CSSProperties } from "react";
import { useState, useEffect } from "react";
import { FormProvider, SubmitHandler, useForm } from "react-hook-form";
import { z } from "zod";

const signupSchema = z.object({
  username: z.string().refine((value) => !value.includes("+"), {
    message: "String should not contain a plus symbol (+).",
  }),
  email: z.string().email(),
  password: z.string().min(7),
  language: z.string().optional(),
  token: z.string().optional(),
  apiError: z.string().optional(), // Needed to display API errors doesnt get passed to the API
});

type FormValues = {
  username: string;
  email: string;
  password: string;
  apiError: string;
  token?: string;
};

type SignupProps = inferSSRProps<typeof getServerSideProps>;

export default function Signup({ prepopulateFormValues, token }: SignupProps) {
  const router = useRouter();
  const { t, i18n } = useLocale();
  const searchParams = useSearchParams();
  const [isModalNoti, setIsModalNoti] = useState(false);
  const [email, setEmail] = useState("");
  const { error } = router.query;
  const [flag, setflag] = useState(true);
  const methods = useForm<FormValues>({
    resolver: zodResolver(signupSchema),
    defaultValues: prepopulateFormValues,
  });
  const {
    register,
    formState: { errors, isSubmitting },
  } = methods;

  useEffect(() => {
    if (typeof error === "string" && flag) {
      setIsModalNoti(true);
      setEmail(error);
      setflag(false);
    }
  }, [error, flag]);

  const handleErrors = async (resp: Response) => {
    if (!resp.ok) {
      const err = await resp.json();
      if (err.message === "blocked") {
        setIsModalNoti(true);
        throw new Error("Company Already Registered");
      }
      throw new Error(err.message);
    }
  };
  const [isBanner, setisBanner] = useState(false);
  const signUp: SubmitHandler<FormValues> = async (data) => {
    const company = data.email.split("@");
    setEmail(company[1]);
    await fetch("/api/auth/signup", {
      body: JSON.stringify({
        ...data,
        language: i18n.language,
        token,
      }),
      headers: {
        "Content-Type": "application/json",
      },
      method: "POST",
    })
      .then(handleErrors)
      .then(async () => {
        // const verifyOrGettingStarted = flags["email-verification"] ? "auth/verify-email" : "getting-started";
        const url = "getting-started";
        await signIn<"credentials">("credentials", {
          ...data,
          callbackUrl: `${
            searchParams?.get("callbackUrl")
              ? `${WEBAPP_URL}${searchParams.get("callbackUrl")}`
              : `${WEBAPP_URL}/${url}`
          }?from=signup`,
        });
      })
      .catch((err) => {
        methods.setError("apiError", { message: err.message });
      });
  };

  const handleModalClose = () => {
    setIsModalNoti(false);
  };

  return (
    <div
      className="bg-muted flex min-h-screen flex-col justify-center "
      style={
        {
          "--quill-brand": "#111827",
          "--quill-brand-emphasis": "#101010",
          "--quill-brand-text": "white",
          "--quill-brand-subtle": "#9CA3AF",
        } as CSSProperties
      }
      aria-labelledby="modal-title"
      role="dialog"
      aria-modal="true"
    >
      <div className="relative -mt-[80px] flex items-center justify-center">
        <img className="h-[40px] w-[40px]" src="/img/logo.png"></img>
      </div>
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h2 className="font-quill text-emphasis text-center text-3xl font-extrabold">
          Create Your Account
        </h2>
      </div>
      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-default mx-2 p-6 shadow sm:rounded-lg lg:p-8">
          <FormProvider {...methods}>
            <form
              onSubmit={(event) => {
                event.preventDefault();
                event.stopPropagation();

                if (methods.formState?.errors?.apiError) {
                  methods.clearErrors("apiError");
                }
                methods.handleSubmit(signUp)(event);
              }}
              className="bg-default space-y-6"
            >
              {errors.apiError && (
                <Alert severity="error" message={errors.apiError?.message} />
              )}
              <div className="space-y-4">
                <TextField
                  id="username"
                  label="User name"
                  placeholder="User name"
                  {...register("username")}
                  required
                />

                <EmailField
                  id="email"
                  label="Email"
                  placeholder="Email"
                  {...register("email")}
                  className="disabled:bg-emphasis disabled:hover:cursor-not-allowed"
                  required
                />
                <PasswordField
                  label="Password"
                  id="password"
                  labelProps={{
                    className: "block text-sm font-medium text-default",
                  }}
                  {...register("password")}
                  required
                  //  hintErrors={["caplow", "min", "num"]}
                  className="border-default mt-1 block w-full rounded-md border px-3 py-2 shadow-sm focus:border-black focus:outline-none focus:ring-black sm:text-sm"
                />
              </div>
              <div className="flex space-x-2 rtl:space-x-reverse">
                <Button
                  type="submit"
                  loading={isSubmitting}
                  className="w-full justify-center text-white"
                >
                  Create account
                </Button>
                <Button
                  color="secondary"
                  className="w-full justify-center"
                  onClick={() =>
                    signIn("quillsocial.com", {
                      callbackUrl: searchParams?.get("callbackUrl")
                        ? `${WEBAPP_URL}/${searchParams.get("callbackUrl")}`
                        : `${WEBAPP_URL}/write/0`,
                    })
                  }
                >
                  Login Instead
                </Button>
              </div>
              <hr className="border-subtle my-8" />
              <div className="my-2 space-y-3 text-center">
                <Button
                  color="secondary"
                  className="w-auto justify-center gap-2 rounded-full"
                  data-testid="google-signup"
                  onClick={async (e) => {
                    e.preventDefault();
                    const cb = searchParams?.get("callbackUrl")
                      ? `${WEBAPP_URL}${searchParams.get("callbackUrl")}`
                      : `${WEBAPP_URL}/getting-started?from=signup`;
                    await signIn("google", { callbackUrl: cb });
                  }}
                >
                  <img className="h-6 w-6" src="/img/gg.png" alt="Google" />
                  Continue with Google
                </Button>
              </div>
            </form>
          </FormProvider>
        </div>
      </div>
      {/* {isBanner && (
        <div className="fixed top-0 w-full">
          <div className="flex items-center gap-x-6 rounded-t-md bg-black px-6 py-2.5 text-white sm:px-3.5 sm:before:flex-1">
            <p className="text-sm leading-6 text-white">
              QuillAI is currently in private beta. We appreciate your interest and will be opening up
              quillsocial soon. Stay tuned for updates!
            </p>
            <div className="flex flex-1 justify-end">
              <button type="button" className="-m-3 p-3 focus-visible:outline-offset-[-4px]">
                <span className="sr-only">Dismiss</span>
                <XMarkIcon
                  onClick={() => setisBanner(!isBanner)}
                  className="h-5 w-5 text-white"
                  aria-hidden="true"
                />
              </button>
            </div>
          </div>
        </div>
      )} */}
      <Dialog open={isModalNoti} onOpenChange={setIsModalNoti}>
        <DialogContent>
          <div>
            <div className="flex items-center justify-center">
              <div className="text-awst text-center text-[20px] font-bold">
                Company Already Registered
              </div>
            </div>
            <div className="text-default mt-2 text-center text-[16px]">
              <p>
                Hello, your company ({email}) has already been registered with
                our platform. Please check in with your company administrator
                for more information. Thanks!
              </p>
            </div>
          </div>
          <DialogFooter className="flex items-center justify-center">
            <Button onClick={handleModalClose}>Done</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export const getServerSideProps = async (ctx: GetServerSidePropsContext) => {
  const prisma = await import("@quillsocial/prisma").then((mod) => mod.default);

  const ssr = await ssrInit(ctx);
  const token = z.string().optional().parse(ctx.query.token);

  const props = {
    isGoogleLoginEnabled:
      !!process.env.GOOGLE_API_CREDENTIALS &&
      (() => {
        try {
          const parsed = JSON.parse(process.env.GOOGLE_API_CREDENTIALS || "{}");
          return !!(parsed?.web?.client_id && parsed?.web?.client_secret);
        } catch (e) {
          return false;
        }
      })(),
    isSAMLLoginEnabled: false,
    trpcState: ssr.dehydrate(),
    prepopulateFormValues: undefined,
  };

  // no token given, treat as a normal signup without verification token
  if (!token) {
    return {
      props: JSON.parse(JSON.stringify(props)),
    };
  }

  const verificationToken = await prisma.verificationToken.findUnique({
    where: {
      token,
    },
  });

  if (!verificationToken || verificationToken.expires < new Date()) {
    return {
      notFound: true,
    };
  }

  const existingUser = await prisma.user.findFirst({
    where: {
      AND: [
        {
          email: verificationToken?.identifier,
        },
        {
          emailVerified: {
            not: null,
          },
        },
      ],
    },
  });

  if (existingUser) {
    return {
      redirect: {
        permanent: false,
        destination:
          "/auth/login?callbackUrl=" + `${WEBAPP_URL}/${ctx.query.callbackUrl}`,
      },
    };
  }

  const guessUsernameFromEmail = (email: string) => {
    const [username] = email.split("@");
    return username;
  };

  let username = guessUsernameFromEmail(verificationToken.identifier);

  const orgInfo = await prisma.user.findFirst({
    where: {
      email: verificationToken?.identifier,
    },
    select: {
      organization: {
        select: {
          slug: true,
          metadata: true,
        },
      },
    },
  });

  return {
    props: {
      ...props,
      token,
      prepopulateFormValues: {
        email: verificationToken.identifier,
        username,
      },
      orgSlug: orgInfo?.organization?.slug ?? null,
    },
  };
};

Signup.isThemeSupported = false;
Signup.PageWrapper = PageWrapper;
