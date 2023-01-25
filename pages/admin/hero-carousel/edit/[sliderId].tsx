import CreateOrUpdateSlideForm from '@components/hero-carousel/hero-slide-form';
import AppLayout from '@components/layouts/app';
import ErrorMessage from '@components/ui/error-message';
import Loader from '@components/ui/loader/loader';
import { useErrorLogger, useGetStaff } from '@hooks/index';
import { verifyAuth, XSRFHandler } from '@middleware/utils';
import { SSRProps } from '@ts-types/custom.types';
import { Category } from '@ts-types/generated';
import { ROUTES } from '@utils/routes';
import type { GetServerSideProps } from 'next';
import { useRouter } from 'next/router';
import { useTranslation } from 'next-i18next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';


export default function UpdateHeroSliderPage({ client }: SSRProps) {
  const { query } = useRouter();
  const { t } = useTranslation();

  const { sliderId } = query;

  // const { data, loading, error } = useQuery<THeroSlider, OptionsVariable>(
  //   HERO_SLIDE,
  //   {
  //     variables: { id: sliderId },
  //     fetchPolicy: 'cache-and-network'
  //   }
  // );

  useGetStaff(client);

  // useErrorLogger(error);

  // if (loading) {
  //   return <Loader text={t('common:text-loading')} />;
  // }
  // if (error) {
  //   return <ErrorMessage message={t('common:MESSAGE_SOMETHING_WENT_WRONG')} />;
  // }

  return (
    <>
      <div className="py-5 sm:py-8 flex border-b border-dashed border-border-base">
        <h1 className="text-lg font-semibold text-heading">
          {t('form:form-title-edit-hero-slider')}
        </h1>
      </div>
      <CreateOrUpdateSlideForm initialValues={{}} />
    </>
  );
}

UpdateHeroSliderPage.Layout = AppLayout;

export const getServerSideProps: GetServerSideProps = async (context) => {
  const { locale } = context;
  const { client } = verifyAuth(context);

  if (!client) {
    return {
      redirect: {
        permanent: false,
        destination: ROUTES.LOGIN
      }
    };
  }

  const { csrfToken, csrfError } = await XSRFHandler(context);

  return {
    props: {
      ...(await serverSideTranslations(locale, ['form', 'common', 'error'])),
      client: { ...(client ?? {}), csrfToken, csrfError }
    }
  };
};
