import { languageOptions } from "@/i18n";
import { mergeClass } from "@/resources/utils/helper";
import Image from "next/image";
import styles from "./styles.module.css";

export default function LanguageSelector({
  containerClass = "",
  selected = "fr",
  setSelected = () => {},
  setDirection = () => {},
  cb = () => {},
}) {
  const options = languageOptions;
  return (
    <div className={mergeClass(styles.main, containerClass)}>
      {options.map((option) => (
        <div
          title={option.label}
          key={option.value}
          onClick={() => {
            setSelected(option.value);
            cb(option.value);
            setDirection(option.isRtl ? "rtl" : "ltr");
          }}
          className={mergeClass(
            selected === option.value ? styles.active : "",
            styles.flag
          )}
        >
          <Image src={option?.imageUrl} alt={option?.label} fill />
        </div>
      ))}
    </div>
  );
}
