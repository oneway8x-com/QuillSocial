import type { GetServerSideProps } from "next";

export const getServerSideProps: GetServerSideProps = async () => {
  return {
    redirect: {
      destination: "/my-content/all",
      permanent: false,
    },
  };
};

export default function LibraryRedirectPage() {
  return null;
}
