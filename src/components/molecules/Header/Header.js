"use client";
import Button from "@/components/atoms/Button";
import DraggableContainer from "@/components/atoms/DraggableContainer/DraggableContainer";
import MenuPopup from "@/components/atoms/MenuPopup/MenuPopup";
import { Link, usePathname, useRouter } from "@/i18n/navigation";
import useDimensions from "@/resources/hooks/useDimensions";
import { useTranslations } from "@/resources/hooks/useTranslations";
import { headerData, headerDataMobile } from "@/resources/utils/headerRoutes";
import { isAdminOrBusinessOwner, mergeClass } from "@/resources/utils/helper";
import { signOutRequest } from "@/store/auth/authSlice";
import Cookies from "js-cookie";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { Container, Offcanvas } from "react-bootstrap";
import { BiMenu, BiX } from "react-icons/bi";
import { CiSettings } from "react-icons/ci";
import { IoNotificationsOutline } from "react-icons/io5";
import { TbLogout } from "react-icons/tb";
import { useDispatch, useSelector } from "react-redux";
import { ReactSVG } from "react-svg";
import classes from "./Header.module.css";

export default function Header() {
  const { permissions } = useSelector((state) => state.authReducer);
  const { user } = useSelector((state) => state.authReducer);
  const role = user?.role;
  const t = useTranslations();
  const router = useRouter();
  const pathName = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const menuButtonRef = useRef(null);
  const navRef = useRef(null);
  const dispatch = useDispatch();
  const { width } = useDimensions();
  const toggleMenu = () => setMobileOpen((open) => !open);

  useEffect(() => {
    if (mobileOpen) {
      document.body.classList.add("fixedPosition");
    } else {
      document.body.classList.remove("fixedPosition");
    }
    return () => {
      document.body.classList.remove("fixedPosition");
    };
  }, [mobileOpen]);

  useEffect(() => {
    if (width >= 1200) {
      setMobileOpen(false);
    }
  }, [width]);

  // Scroll navigation to active item
  useEffect(() => {
    if (navRef.current) {
      const activeLink = navRef.current.querySelector(
        `.${classes.activeRoute}`,
      );
      if (activeLink) {
        // Scroll the active link into view
        activeLink.scrollIntoView({
          behavior: "smooth",
          block: "nearest",
          inline: "center",
        });
      }
    }
  }, [pathName]); // Scroll to active item when route changes

  function handleLogout() {
    router.push("/");
    dispatch(signOutRequest());
    Cookies.remove("_xpdx_acom");
    Cookies.remove("_xpdx_rf_acom");
    Cookies.remove("role");
  }

  if (
    [
      "/",
      "/login",
      "/forgot-password",
      "/reset-password",
      "/verify-otp",
      "/access-denied",
      "/login/admin",
      "/login/nationwide-dashboard",
    ].includes(pathName)
  ) {
    return null;
  }

  return (
    <>
      <header className={classes.header}>
        <Container className="containerFluid">
          <div className={classes?.headerMain}>
            {/* Logo */}

            <button
              className={classes.logoContainer}
              onClick={() => router.push(`/dashboard`)}
            >
              <div className={classes.logo}>
                <Image src="/svg/logo.svg" alt="logo" fill />
              </div>
              <h1>Acommify</h1>
            </button>

            <div className={classes.userDiv}>
              {/* <LanguageSwitcher containerClass={classes.languageSwitcher} /> */}

              {/* notification */}
              {permissions.includes("view-notifications") && (
                <div onClick={() => router.push(`/notifications`)}>
                  <IoNotificationsOutline size={24} />
                </div>
              )}

              {/* settings */}
              {isAdminOrBusinessOwner(role) && (
                <div onClick={() => router.push(`/settings`)}>
                  <CiSettings size={24} />
                </div>
              )}

              <Button label={t("common.logout")} onClick={handleLogout} />
            </div>

            {/* Mobile Hamburger */}

            <button
              type="button"
              className={classes.mobileMenuButton}
              onClick={toggleMenu}
              ref={menuButtonRef}
            >
              <BiMenu size={30} />
            </button>
          </div>
          {/* Navigation Menu */}
          <div className={classes?.bottomHeader}>
            <DraggableContainer className={classes.nav}>
              {headerData(t, permissions, user)?.map((item, index) =>
                item.children ? (
                  <MenuPopup
                    key={index}
                    items={item.children}
                    align="end"
                    menuButton={
                      <div
                        className={mergeClass(
                          classes.link,
                          pathName.startsWith(item.route)
                            ? classes.activeRoute
                            : "",
                        )}
                      >
                        <ReactSVG src={item.icon} />
                        {item.label}
                      </div>
                    }
                  />
                ) : (
                  <Link
                    key={index}
                    href={item.route}
                    onClick={() => console.log("Link")}
                    className={mergeClass(
                      classes.link,
                      pathName.startsWith(item.route)
                        ? classes.activeRoute
                        : "",
                    )}
                  >
                    <ReactSVG src={item.icon} />
                    {item.label}
                  </Link>
                ),
              )}
            </DraggableContainer>
          </div>
        </Container>
      </header>

      <Offcanvas
        show={mobileOpen}
        onHide={toggleMenu}
        placement="end"
        className={classes.mobileMenu}
      >
        <div className={classes.crossMain}>
          <div
            className={mergeClass(classes.logoContainer, classes.mobileLogo)}
            onClick={() => {
              setMobileOpen(false);
              router.push(`/dashboard`);
            }}
          >
            <div className={classes.logo}>
              <Image src="/svg/logo.svg" alt="logo" fill />
            </div>
            <h1>Acommify</h1>
          </div>
          <BiX size={30} onClick={toggleMenu} style={{ cursor: "pointer" }} />
        </div>
        <div className={classes.languageSwitcherMobileDiv}>
          {/* <LanguageSwitcher containerClass={classes.languageSwitcherMobile} /> */}
        </div>
        <Offcanvas.Body className={classes.mobileMenuContent}>
          <nav className={classes?.mobileNav}>
            {headerDataMobile(t, permissions, user)?.map((item, index) => (
              <Link
                key={index}
                href={item?.route}
                className={mergeClass(
                  classes.link,
                  pathName === item?.route ? classes.activeRoute : "",
                )}
                onClick={() => setMobileOpen(false)}
              >
                <ReactSVG
                  src={item?.icon}
                  className={pathName === item?.route ? classes.navIcon : ""}
                  width={"24px"}
                  height={"24px"}
                />
                {item?.label}
              </Link>
            ))}
          </nav>
        </Offcanvas.Body>
        {/* logout button */}
        <div onClick={handleLogout} className={classes.menuItemLogout}>
          <TbLogout size={20} />
          <p>{t("common.logout")}</p>
        </div>
      </Offcanvas>
    </>
  );
}
