import LinkButton from '@components/ui/link-button';
import Logo from '@components/ui/logo';
import { useUI } from '@contexts/ui.context';
import { ROUTES } from '@utils/routes';
import classNames from 'classnames/bind';
import { motion } from 'framer-motion';
import { useTranslation } from 'next-i18next';

import NavMenu from './menu';
import NavNotification from './notification';
import styles from './scss/index.module.scss';

let cx = classNames.bind(styles);

const Navbar = () => {
  const { t } = useTranslation();
  const { toggleSidebar } = useUI();

  const menuIsOpen = false;

  const menuSpanClass = cx('span', {
    'span--open': menuIsOpen,
    'span--close': !menuIsOpen
  });

  return (
    <header style={{ zIndex: 100 }} className="bg-white shadow fixed w-full">
      <nav
        style={{ backgroundColor: '#181818' }}
        className="px-5 md:px-8 py-2 flex items-center justify-between border-b border-gray-900"
      >
        {/* <!-- Mobile menu button --> */}
        <motion.button
          whileTap={{ scale: 0.88 }}
          onClick={toggleSidebar}
          className="flex relative h-full items-center justify-center focus:outline-none focus:text-accent lg:hidden"
        >
          <div className={cx('menu-icon-container')}>
            <span className={menuSpanClass}></span>
            <span className={menuSpanClass}></span>
            <span className={menuSpanClass}></span>
          </div>
        </motion.button>
        <div className="hidden md:flex me-auto">
          <Logo />
        </div>
        <div className="flex items-center space-s-8">
          <LinkButton
            href={`${ROUTES.PRODUCTS}/create`}
            className="ms-4 md:ms-6"
            size="small"
          >
            {t('common:text-create-product')}
          </LinkButton>
          <NavNotification />
          <NavMenu />
        </div>
      </nav>
    </header>
  );
};

export default Navbar;
