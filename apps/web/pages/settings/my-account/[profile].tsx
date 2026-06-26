import PageWrapper from "@components/PageWrapper";
import AppCard from "@components/apps/AppCard";
import InstallApp from "@components/apps/InstallApp";
import apps from "@components/apps/appsData";
import TwoFactor from "@components/auth/TwoFactor";
import { SelectSkeletonLoader } from "@components/common/SkeletonLoader";
import ProfileForm from "@components/profile/ProfileForm";
import { zodResolver } from "@hookform/resolvers/zod";
import { ErrorCode } from "@quillsocial/features/auth/lib/ErrorCode";
import OpenAIUsageCard from "@quillsocial/features/settings/components/OpenAIUsageCard";
import Shell from "@quillsocial/features/shell/Shell";
import { FULL_NAME_LENGTH_MAX_LIMIT } from "@quillsocial/lib/constants";
import { APP_NAME } from "@quillsocial/lib/constants";
import { useLocale } from "@quillsocial/lib/hooks/useLocale";
import { IdentityProvider } from "@quillsocial/prisma/enums";
import type { TRPCClientErrorLike } from "@quillsocial/trpc/client";
import { trpc } from "@quillsocial/trpc/react";
import type { AppRouter } from "@quillsocial/trpc/server/routers/_app";
import { HorizontalTabs, TextAreaField } from "@quillsocial/ui";
import type {
  VerticalTabItemProps,
  HorizontalTabItemProps,
} from "@quillsocial/ui";
import {
  Alert,
  Avatar,
  Button,
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogTrigger,
  Form,
  ImageUploader,
  Meta,
  PasswordField,
  showToast,
  SkeletonAvatar,
  SkeletonButton,
  SkeletonContainer,
  SkeletonText,
  TextField,
  Label,
  InputField,
  Select,
  TimezoneSelect,
} from "@quillsocial/ui";
import { AlertTriangle } from "@quillsocial/ui/components/icon";
import { signOut } from "next-auth/react";
import { useRouter } from "next/router";
import type { BaseSyntheticEvent } from "react";
import { useRef, useState } from "react";
import { Controller, useForm, useFormContext } from "react-hook-form";
import { z } from "zod";

const SkeletonLoader = ({
  title,
  description,
}: {
  title: string;
  description: string;
}) => {
  return (
    <SkeletonContainer>
      <Shell>
        <Meta title={title} description={description} />
        <div className="mb-8 mt-6 space-y-6">
          <div className="flex items-center">
            <SkeletonAvatar className="me-4 h-16 w-16 px-4" />
            <SkeletonButton className="h-6 w-32 rounded-md p-5" />
          </div>
          <SkeletonText className="h-8 w-full" />
          <SkeletonText className="h-8 w-full" />
          <SkeletonText className="h-8 w-full" />

          <SkeletonButton className="mr-6 h-8 w-20 rounded-md p-5" />
        </div>
      </Shell>
    </SkeletonContainer>
  );
};

interface DeleteAccountValues {
  totpCode: string;
}

type FormValues = {
  username: string;
  avatar: string;
  name: string;
  email: string;
  bio: string;
  mobile: string;
  timeZone: string;
  timeFormat: number;
  weekStart: string;
  description?: string;
  speakAbout?: string;
};

const ProfileView = () => {
  const { t } = useLocale();
  const utils = trpc.useContext();
  const { data: user, isLoading } = trpc.viewer.me.useQuery();
  const { data: avatar, isLoading: isLoadingAvatar } =
    trpc.viewer.avatar.useQuery();
  const mutation = trpc.viewer.updateProfile.useMutation({
    onSuccess: () => {
      showToast(t("settings_updated_successfully"), "success");
      utils.viewer.me.invalidate();
      // utils.viewer.avatar.invalidate();
      setTempFormValues(null);
    },
    onError: () => {
      showToast(t("error_updating_settings"), "error");
    },
  });

  const tabs: (VerticalTabItemProps | HorizontalTabItemProps)[] = [
    {
      name: "Profile",
      href: "/settings/my-account/profile",
    },
    // {
    //   name: "Settings",
    //   href: "/settings/my-account/settings",
    // },
    {
      name: "App Integrations",
      href: "/settings/my-account/app-integrations",
    },
    {
      name: "Billing",
      href: "/billing/overview",
    },
    {
      name: "AI Usage",
      href: "/billing/usage",
    },
  ];

  const router = useRouter();
  const slug = router.query.profile;

  const [confirmPasswordOpen, setConfirmPasswordOpen] = useState(false);
  const [tempFormValues, setTempFormValues] = useState<FormValues | null>(null);
  const [confirmPasswordErrorMessage, setConfirmPasswordDeleteErrorMessage] =
    useState("");

  const [deleteAccountOpen, setDeleteAccountOpen] = useState(false);
  const [hasDeleteErrors, setHasDeleteErrors] = useState(false);
  const [deleteErrorMessage, setDeleteErrorMessage] = useState("");
  const form = useForm<DeleteAccountValues>();

  const onDeleteMeSuccessMutation = async () => {
    await utils.viewer.me.invalidate();
    showToast(t("Your account was deleted"), "success");

    setHasDeleteErrors(false); // dismiss any open errors
    if (process.env.NEXT_PUBLIC_WEBAPP_URL === "https://app.quillsocial.com") {
      signOut({ callbackUrl: "/auth/logout?survey=true" });
    } else {
      signOut({ callbackUrl: "/auth/logout" });
    }
  };

  const confirmPasswordMutation = trpc.viewer.auth.verifyPassword.useMutation({
    onSuccess() {
      if (tempFormValues) mutation.mutate(tempFormValues);
      setConfirmPasswordOpen(false);
    },
    onError() {
      setConfirmPasswordDeleteErrorMessage(t("incorrect_password"));
    },
  });

  const onDeleteMeErrorMutation = (error: TRPCClientErrorLike<AppRouter>) => {
    setHasDeleteErrors(true);
    setDeleteErrorMessage(errorMessages[error.message]);
  };
  const deleteMeMutation = trpc.viewer.deleteMe.useMutation({
    onSuccess: onDeleteMeSuccessMutation,
    onError: onDeleteMeErrorMutation,
    async onSettled() {
      await utils.viewer.me.invalidate();
    },
  });
  const deleteMeWithoutPasswordMutation =
    trpc.viewer.deleteMeWithoutPassword.useMutation({
      onSuccess: onDeleteMeSuccessMutation,
      onError: onDeleteMeErrorMutation,
      async onSettled() {
        await utils.viewer.me.invalidate();
      },
    });

  const isCALIdentityProviver = user?.identityProvider === IdentityProvider.DB;

  const onConfirmPassword = (
    e: Event | React.MouseEvent<HTMLElement, MouseEvent>
  ) => {
    e.preventDefault();

    const password = passwordRef.current.value;
    confirmPasswordMutation.mutate({ passwordInput: password });
  };

  const onConfirmButton = (
    e: Event | React.MouseEvent<HTMLElement, MouseEvent>
  ) => {
    e.preventDefault();
    if (isCALIdentityProviver) {
      const totpCode = form.getValues("totpCode");
      const password = passwordRef.current.value;
      deleteMeMutation.mutate({ password, totpCode });
    } else {
      deleteMeWithoutPasswordMutation.mutate();
    }
  };

  const onConfirm = (
    { totpCode }: DeleteAccountValues,
    e: BaseSyntheticEvent | undefined
  ) => {
    e?.preventDefault();
    if (isCALIdentityProviver) {
      const password = passwordRef.current.value;
      deleteMeMutation.mutate({ password, totpCode });
    } else {
      deleteMeWithoutPasswordMutation.mutate();
    }
  };

  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  const passwordRef = useRef<HTMLInputElement>(null!);

  const errorMessages: { [key: string]: string } = {
    [ErrorCode.SecondFactorRequired]: t("2fa_enabled_instructions"),
    [ErrorCode.IncorrectPassword]: `${t("incorrect_password")} ${t(
      "please_try_again"
    )}`,
    [ErrorCode.UserNotFound]: t("no_account_exists"),
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

  if (isLoading || !user || isLoadingAvatar || !avatar)
    return (
      <SkeletonLoader
        title={t("profile")}
        description={t("profile_description", { appName: APP_NAME })}
      />
    );

  const defaultValues = {
    username: user.username || "",
    avatar: avatar.avatar || "",
    name: user.name || "",
    email: user.email || "",
    bio: user.bio || "",
    mobile: user.mobile || "",
    language: "",
    timeZone: user.timeZone || "",
    timeFormat: user.timeFormat || 12,
    weekStart: user.weekStart || "",
    description: user.description || "",
    speakAbout: user.speakAbout || "",
  };
  return (
    <>
      <Shell
        withoutSeo
        heading="Settings"
        hideHeadingOnMobile
        subtitle="Manage your profile, app connections, billing, and AI usage."
      >
        <Meta
          title={t("profile")}
          description={t("profile_description", { appName: "QuillAI" })}
        />
        <div className=" h-[37px] border-b-2 ">
          <div className="flex font-bold ">
            {" "}
            <HorizontalTabs tabs={tabs} />{" "}
          </div>
        </div>
        {slug === "profile" ? (
          <>
            <div className="grid grid-cols-12">
              <div className="col-span-10 ml-[50px] sm:col-span-6 sm:ml-1">
                {/* <div>
                  <OpenAIUsageCard />
                </div> */}
                <ProfileForm
                  key={JSON.stringify(defaultValues)}
                  defaultValues={defaultValues}
                  isLoading={mutation.isLoading}
                  onSubmit={(values) => {
                    if (values.email !== user.email && isCALIdentityProviver) {
                      setTempFormValues(values);
                      setConfirmPasswordOpen(true);
                    } else {
                      mutation.mutate(values);
                    }
                  }}
                />
              </div>
            </div>
          </>
        ) : slug === "settings" ? (
          <>
            <div className="mt-2 flex"></div>
            <div className="grid grid-cols-12">
              <div className="col-span-10 ml-[50px] sm:col-span-6 sm:ml-1">
                <SettingForm
                  key={JSON.stringify(defaultValues)}
                  defaultValues={defaultValues}
                  isLoading={mutation.isLoading}
                  onSubmit={(values) => {
                    mutation.mutate(values);
                  }}
                />
              </div>
            </div>
          </>
        ) : slug === "app-integrations" ? (
          <>
            <div className="mt-5 rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                  <h2 className="text-base font-semibold text-gray-950">
                    API Keys & BYOK
                  </h2>
                  <p className="mt-2 text-sm leading-6 text-gray-600">
                    Connect your own X API key or AI provider key for higher
                    usage limits and cost control.
                  </p>
                </div>
                <Button
                  href="/settings/my-account/app-integrations"
                  color="secondary"
                  className="w-fit"
                >
                  Configure keys
                </Button>
              </div>
            </div>
            <div className="mt-5 grid grid-cols-1 gap-5 md:grid-cols-2">
              {apps.map((app) => (
                <AppCard
                  key={app.installProps.slug}
                  title={app.title}
                  description={app.description}
                  logoSrc={app.logoSrc}
                  installProps={app.installProps}
                />
              ))}
            </div>
          </>
        ) : null}
        {/* Delete account Dialog */}
        <Dialog open={deleteAccountOpen} onOpenChange={setDeleteAccountOpen}>
          <DialogTrigger asChild>
            {/*<Button data-testid="delete-account" color="destructive" className="mt-1" StartIcon={Trash2}>
            {t("delete_account")}
        </Button> */}
          </DialogTrigger>
          <DialogContent
            title={t("delete_account_modal_title")}
            description={t("confirm_delete_account_modal", {
              appName: APP_NAME,
            })}
            type="creation"
            Icon={AlertTriangle}
          >
            <>
              <div className="mb-10">
                <p className="text-default mb-4">
                  {t("delete_account_confirmation_message", {
                    appName: APP_NAME,
                  })}
                </p>
                {isCALIdentityProviver && (
                  <PasswordField
                    data-testid="password"
                    name="password"
                    id="password"
                    autoComplete="current-password"
                    required
                    label="Password"
                    ref={passwordRef}
                  />
                )}

                {user?.twoFactorEnabled && isCALIdentityProviver && (
                  <Form handleSubmit={onConfirm} className="pb-4" form={form}>
                    <TwoFactor center={false} />
                  </Form>
                )}

                {hasDeleteErrors && (
                  <Alert severity="error" title={deleteErrorMessage} />
                )}
              </div>
              <DialogFooter showDivider>
                <DialogClose />
                <Button
                  color="primary"
                  className="text-white"
                  data-testid="delete-account-confirm"
                  onClick={(e) => onConfirmButton(e)}
                >
                  {t("delete_my_account")}
                </Button>
              </DialogFooter>
            </>
          </DialogContent>
        </Dialog>

        {/* If changing email, confirm password */}
        <Dialog
          open={confirmPasswordOpen}
          onOpenChange={setConfirmPasswordOpen}
        >
          <DialogContent
            title={t("confirm_password")}
            description={t("confirm_password_change_email")}
            type="creation"
            Icon={AlertTriangle}
          >
            <div className="mb-10">
              <PasswordField
                data-testid="password"
                name="password"
                id="password"
                autoComplete="current-password"
                required
                label="Password"
                ref={passwordRef}
              />
              {confirmPasswordErrorMessage && (
                <Alert severity="error" title={confirmPasswordErrorMessage} />
              )}
            </div>
            <DialogFooter showDivider>
              <Button
                className="text-white"
                color="primary"
                onClick={(e) => onConfirmPassword(e)}
              >
                {t("confirm")}
              </Button>
              <DialogClose />
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </Shell>
    </>
  );
};

const SettingForm = ({
  defaultValues,
  onSubmit,
  isLoading = false,
}: {
  defaultValues: FormValues;
  onSubmit: (values: FormValues) => void;
  isLoading: boolean;
}) => {
  const { t } = useLocale();
  const settingFormSchema = z.object({
    // language: z.string(),
    timeZone: z.string(),
    timeFormat: z.number(),
    weekStart: z.string(),
  });

  const formMethods = useForm<FormValues>({
    defaultValues,
    resolver: zodResolver(settingFormSchema),
  });

  const {
    formState: { errors, isSubmitting, isDirty },
  } = formMethods;
  const isDisabled = isSubmitting || !isDirty;
  return (
    <Form form={formMethods} handleSubmit={onSubmit}>
      <div className="flex items-center"></div>
      {/* <div className="mt-9">
        <label className="mb-[6px] block text-sm font-medium text-gray-900 dark:text-white">
          Language
        </label>
        <select
          className="block w-full rounded border border-[#D5D9DC] p-2.5 text-sm text-gray-900">
          <option selected>  </option>
          <option value="French" selected>
            French{" "}
          </option>
        </select>
      </div> */}
      <div className="mt-9">
        <label className="mb-[6px] block text-sm font-medium text-gray-900 dark:text-white">
          Timezone
        </label>
        <Controller
          name="timeZone"
          render={({ field: { onChange, value } }) =>
            value ? (
              <TimezoneSelect
                value={value}
                className="focus:border-brand-default border-default mt-1 block  rounded-md text-sm"
                onChange={(timezone) => onChange(timezone.value)}
              />
            ) : (
              <SelectSkeletonLoader className="mt-1" />
            )
          }
        />
      </div>
      <div className="mt-9">
        <Label htmlFor="timeFormat">{t("Time format")}</Label>
        <Controller
          name="timeFormat"
          control={formMethods.control}
          render={({ field: { onChange, value }, fieldState: { error } }) => {
            const hourOptions = [
              ...[12, 24].map((hour) => ({
                label: hour + " " + t("hour"),
                value: hour,
              })),
            ];
            return (
              <>
                <Select
                  isSearchable={false}
                  onChange={(val: any) => {
                    if (val) onChange(val.value);
                  }}
                  defaultValue={
                    hourOptions.find((option) => option.value === value) ||
                    hourOptions[0]
                  }
                  options={hourOptions}
                />
                {error && (
                  <span className="text-red-500">
                    {error.message}
                    <br></br>
                  </span>
                )}
              </>
            );
          }}
        />
        <span className="text-justify text-xs font-normal leading-6">
          This is an internal setting and will not affect how times are
          displayed on public booking pages for you or anyone booking you.
        </span>
      </div>
      <div className="mt-7">
        <Label htmlFor="weekStart">{t("Start of the week")}</Label>
        <Controller
          name="weekStart"
          control={formMethods.control}
          render={({ field: { onChange, value }, fieldState: { error } }) => {
            const weekOptions = [
              ...[
                "Monday",
                "Tuesday",
                "Wednesday",
                "Thursday",
                "Friday",
                "Saturday",
                "Sunday",
              ].map((day) => ({
                label: day,
                value: day,
              })),
            ];
            return (
              <>
                <Select
                  isSearchable={false}
                  onChange={(val: any) => {
                    if (val) onChange(val.value);
                  }}
                  defaultValue={
                    weekOptions.find((option) => option.value === value) ||
                    weekOptions[0]
                  }
                  options={weekOptions}
                />
                {error && (
                  <span className="text-red-500">
                    {error.message}
                    <br></br>
                  </span>
                )}
              </>
            );
          }}
        />
      </div>
      <Button
        loading={isLoading}
        disabled={isDisabled}
        color="primary"
        className="mt-8 text-white"
        type="submit"
      >
        {t("Update")}
      </Button>
    </Form>
  );
};

function NewPasswordButton({ name = "new-password" }: { name?: string }) {
  const { t } = useLocale();
  const form = useFormContext<{
    password: string;
    newPassword: string;
    passWordConfirm: string;
  }>();
  const { register } = form;
  return (
    <Dialog name={name}>
      <DialogTrigger asChild>
        <Button
          className="bg-awstbgbt text-awst w-full pl-[30%] text-sm hover:text-white"
          data-testid={name}
        >
          {t("Password Change")}
        </Button>
      </DialogTrigger>
      <DialogContent title={t("Password Change")}>
        <Form
          form={form}
          handleSubmit={(values) => {
            return values;
          }}
        >
          <InputField
            label={t("Old Pasword")}
            type="password"
            required
            placeholder={t("*********")}
            {...register("password")}
          />
          <InputField
            label={t("New Password")}
            type="password"
            required
            placeholder={t("*********")}
            {...register("newPassword")}
          />
          <InputField
            label={t("Confirm Password")}
            type="password"
            required
            placeholder={t("*********")}
            {...register("passWordConfirm")}
          />
          <DialogFooter>
            <DialogClose />
            <Button type="submit" className="hover:bg-awst text-white">
              {t("continue")}
            </Button>
          </DialogFooter>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

//ProfileView.getLayout = getLayout;
ProfileView.PageWrapper = PageWrapper;

export default ProfileView;
