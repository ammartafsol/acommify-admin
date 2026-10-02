"use client";
import Button from "@/components/atoms/Button";
import ImageUpload from "@/components/atoms/ImageUpload";
import Input from "@/components/atoms/Input/Input";
import LanguageSelector from "@/components/atoms/LanguageSelector/LanguageSelector";
import QuillInput from "@/components/atoms/QuillInput";
import RenderToast from "@/components/atoms/RenderToast";
import SpinnerLoading from "@/components/atoms/SpinnerLoading/SpinnerLoading";
import { TextArea } from "@/components/atoms/TextArea/TextArea";
import TopHeader from "@/components/molecules/TopHeader/TopHeader";
import useAxios from "@/interceptor/axios-functions";
import {
  getFilteredObjectRemove,
  getFormattedParams,
  mergeClass,
  returnKeyEmptyAsPerType,
  unWantedKeys,
} from "@/resources/utils/helper";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Col, Container, Row } from "react-bootstrap";
import { MdDelete } from "react-icons/md";
import styles from "./styles.module.css";
import { useLocale } from "next-intl";

export default function CMSDetailTemplate({ pageName }) {
  const { Get, Delete, Post, Patch } = useAxios();
  const router = useRouter();
  const [pageData, setPageData] = useState({});
  const [loading, setLoading] = useState(false);
  const [hideActions, setHideActions] = useState(false);
  const locale = useLocale();
  const [selected, setSelected] = useState(locale);

  async function getData() {
    setLoading("initial");
    const { response } = await Get({
      route: `admin/cms/page/${pageName}`,
    });
    if (response) {
      let clone = structuredClone(response?.data);
      clone = getFilteredObjectRemove(clone, unWantedKeys);
      setPageData(clone);
    } else {
      router.push("/cms");
      RenderToast({
        type: "error",
        message: "Page not found",
      });
    }
    setLoading("");
  }

  useEffect(() => {
    getData();
  }, []);

  // let hideActions = false;

  //   handle array value deletion
  const handleArrayValueDelete = ({ key, level2Key, level2ArrayIndex }) => {
    setPageData((prevState) => {
      return {
        ...prevState,
        [key]: {
          ...prevState[key],
          [level2Key]: [
            ...prevState[key][level2Key].slice(0, level2ArrayIndex),
            ...prevState[key][level2Key].slice(level2ArrayIndex + 1),
          ],
        },
      };
    });
  };

  //   handleSubmit
  const handleSubmit = async () => {
    setHideActions(true);
    setLoading("submit");
    const { response } = await Patch({
      route: `cms/page/update/${pageName}`,
      data: pageData,
    });
    setLoading("");
    setHideActions(false);
    if (response) {
      RenderToast({
        message: "Data saved successfully",
        type: "success",
      });
      getData();
    }
  };

  // array values header
  const renderArrayValuesHeader = ({ cb, isLeft }) => {
    if (hideActions) {
      return null;
    }
    return (
      <div
        className={`d-flex ${isLeft ? "" : "justify-content-end"} mb-3 ${
          styles?.addMoreButton
        }`}
      >
        <Button label={"Add More"} variant="outlined" onClick={() => cb()} />
      </div>
    );
  };

  //   render array values
  const renderArrayValues = ({ key, level2Key, InputComponent }) => {
    return (
      <Row key={key} className={`${styles?.arrayContainer} mb-4 mt-4`}>
        {/* Header */}
        {renderArrayValuesHeader({
          cb: () => {
            setPageData((prevState) => {
              let itemToAdd = returnKeyEmptyAsPerType(
                pageData[key][level2Key][0]
              );

              return {
                ...prevState,
                [key]: {
                  ...prevState[key],
                  [level2Key]: [...prevState[key][level2Key], itemToAdd],
                },
              };
            });
          },
        })}

        <div className={styles?.arrayContainerGrid}>
          {pageData[key][level2Key]?.map(
            (level2ArrayItem, level2ArrayIndex) => {
              // remove unwanted keys
              if (unWantedKeys.includes(level2ArrayItem)) return null;

              // if type is array => render as array
              return (
                <div
                  key={level2ArrayIndex}
                  className={`${styles?.arrayInputContainer} ${styles?.arrayInputContainer2} mb-2 text-center`}
                >
                  {typeof level2ArrayItem === "string" && (
                    <InputComponent
                      key={level2ArrayIndex}
                      label={`Item No. ${level2ArrayIndex + 1}`}
                      placeholder={`Enter ${level2ArrayIndex + 1} value`}
                      value={level2ArrayItem}
                      setValue={(value) => {
                        setPageData((prevState) => {
                          return {
                            ...prevState,
                            [key]: {
                              ...prevState[key],
                              [level2Key]: [
                                ...prevState[key][level2Key].slice(
                                  0,
                                  level2ArrayIndex
                                ),
                                value,
                                ...prevState[key][level2Key].slice(
                                  level2ArrayIndex + 1
                                ),
                              ],
                            },
                          };
                        });
                      }}
                    />
                  )}

                  {typeof level2ArrayItem === "object" &&
                    Object.keys(level2ArrayItem).map(
                      (level3Key, level3Index) => {
                        const _InputComponent = theInputComponent(level3Key);

                        // remove unwanted keys
                        if (unWantedKeys.includes(level3Key)) return null;
                        if (typeof level2ArrayItem[level3Key] === "object") {
                          if (Array.isArray(level2ArrayItem[level3Key])) {
                            return level2ArrayItem[level3Key]?.map(
                              (level4Item, level4ItemIndex) => {
                                const __InputComponent =
                                  theInputComponent(level4Item);

                                // remove unwanted keys
                                if (unWantedKeys.includes(level4Item))
                                  return null;
                                return (
                                  <Row
                                    className={`${styles?.arrayContainer} mb-4 mt-4`}
                                  >
                                    {level4ItemIndex == 0 &&
                                      renderArrayValuesHeader({
                                        isLeft: true,
                                        cb: () => {
                                          setPageData((prevState) => {
                                            let itemToAdd =
                                              returnKeyEmptyAsPerType(
                                                pageData[key][level2Key][0][
                                                  level3Key
                                                ][0]
                                              );
                                            return {
                                              ...prevState,
                                              [key]: {
                                                ...prevState[key],
                                                [level2Key]: [
                                                  ...prevState[key][
                                                    level2Key
                                                  ].slice(0, level2ArrayIndex),
                                                  {
                                                    ...prevState[key][
                                                      level2Key
                                                    ][level2ArrayIndex],
                                                    [level3Key]: [
                                                      ...prevState[key][
                                                        level2Key
                                                      ][level2ArrayIndex][
                                                        level3Key
                                                      ],
                                                      itemToAdd,
                                                    ],
                                                  },
                                                  ...prevState[key][
                                                    level2Key
                                                  ].slice(level2ArrayIndex + 1),
                                                ],
                                              },
                                            };
                                          });
                                        },
                                      })}
                                    <Col
                                      md={12}
                                      key={level4ItemIndex}
                                      className={`${styles?.arrayInputContainer} mb-2`}
                                    >
                                      {typeof level4Item === "string" && (
                                        <__InputComponent
                                          key={level4ItemIndex}
                                          placeholder={`Enter ${
                                            level4ItemIndex + 1
                                          } value`}
                                          value={level4Item}
                                          setValue={(value) => {
                                            setPageData((prevState) => {
                                              return {
                                                ...prevState,
                                                [key]: {
                                                  ...prevState[key],
                                                  [level2Key]: [
                                                    ...prevState[key][
                                                      level2Key
                                                    ].slice(
                                                      0,
                                                      level2ArrayIndex
                                                    ),
                                                    {
                                                      ...prevState[key][
                                                        level2Key
                                                      ][level2ArrayIndex],
                                                      [level3Key]: [
                                                        ...prevState[key][
                                                          level2Key
                                                        ][level2ArrayIndex][
                                                          level3Key
                                                        ].slice(
                                                          0,
                                                          level4ItemIndex
                                                        ),
                                                        value,
                                                        ...prevState[key][
                                                          level2Key
                                                        ][level2ArrayIndex][
                                                          level3Key
                                                        ].slice(
                                                          level4ItemIndex + 1
                                                        ),
                                                      ],
                                                    },
                                                    ...prevState[key][
                                                      level2Key
                                                    ].slice(
                                                      level2ArrayIndex + 1
                                                    ),
                                                  ],
                                                },
                                              };
                                            });
                                          }}
                                        />
                                      )}

                                      {/* type of level4Item is object */}
                                      {typeof level4Item === "object" &&
                                        Object.keys(level4Item).map(
                                          (level5Key, level5Index) => {
                                            // if array
                                            if (
                                              level4Item[level5Key] &&
                                              Array.isArray(
                                                level4Item[level5Key]
                                              )
                                            ) {
                                              return level4Item[level5Key]?.map(
                                                (
                                                  level5Item,
                                                  level5ItemIndex
                                                ) => {
                                                  const ___InputComponent =
                                                    theInputComponent(
                                                      level5Key
                                                    );
                                                  return (
                                                    <Row
                                                      className={`${styles?.arrayContainer} mb-4 mt-4`}
                                                      key={level5ItemIndex}
                                                    >
                                                      <Col
                                                        md={12}
                                                        key={level5ItemIndex}
                                                        className={`${styles?.arrayInputContainer} mb-2`}
                                                      >
                                                        {typeof level5Item ===
                                                          "string" && (
                                                          <___InputComponent
                                                            label={getFormattedParams(
                                                              level5Key
                                                            )}
                                                            key={
                                                              level5ItemIndex
                                                            }
                                                            placeholder={`Enter ${
                                                              level5ItemIndex +
                                                              1
                                                            } value`}
                                                            value={level5Item}
                                                            setValue={(
                                                              value
                                                            ) => {
                                                              // set at level5ItemIndex
                                                              setPageData(
                                                                (prevState) => {
                                                                  return {
                                                                    ...prevState,
                                                                    [key]: {
                                                                      ...prevState[
                                                                        key
                                                                      ],
                                                                      [level2Key]:
                                                                        prevState[
                                                                          key
                                                                        ][
                                                                          level2Key
                                                                        ].map(
                                                                          (
                                                                            level2Item,
                                                                            index
                                                                          ) => {
                                                                            if (
                                                                              index ===
                                                                              level2ArrayIndex
                                                                            ) {
                                                                              return {
                                                                                ...level2Item,
                                                                                [level3Key]:
                                                                                  level2Item[
                                                                                    level3Key
                                                                                  ].map(
                                                                                    (
                                                                                      level3Item,
                                                                                      subIndex
                                                                                    ) => {
                                                                                      if (
                                                                                        subIndex ===
                                                                                        level4ItemIndex
                                                                                      ) {
                                                                                        return {
                                                                                          ...level3Item,
                                                                                          [level5Key]:
                                                                                            level3Item[
                                                                                              level5Key
                                                                                            ].map(
                                                                                              (
                                                                                                level5Item,
                                                                                                level5Index
                                                                                              ) => {
                                                                                                if (
                                                                                                  level5Index ===
                                                                                                  level5ItemIndex
                                                                                                ) {
                                                                                                  // Set value at index 0 of level5
                                                                                                  return value; // Set new value at index 0
                                                                                                }
                                                                                                return level5Item; // Keep the original item if not the index you want
                                                                                              }
                                                                                            ),
                                                                                        };
                                                                                      }
                                                                                      return level3Item; // If not matching, return the original level3 item
                                                                                    }
                                                                                  ),
                                                                              };
                                                                            }
                                                                            return level2Item; // If not matching, return the original level2 item
                                                                          }
                                                                        ),
                                                                    },
                                                                  };
                                                                }
                                                              );
                                                            }}
                                                          />
                                                        )}
                                                      </Col>
                                                    </Row>
                                                  );
                                                }
                                              );
                                            }

                                            // remove unwanted keys
                                            if (
                                              unWantedKeys.includes(level5Key)
                                            )
                                              return null;
                                            const ___InputComponent =
                                              theInputComponent(level5Key);

                                            return (
                                              <___InputComponent
                                                key={level5Index}
                                                label={getFormattedParams(
                                                  level5Key
                                                )}
                                                placeholder={`Enter ${level5Key}`}
                                                value={level4Item[level5Key]}
                                                setValue={(value) => {
                                                  setPageData((prevState) => {
                                                    return {
                                                      ...prevState,
                                                      [key]: {
                                                        ...prevState[key],
                                                        [level2Key]: [
                                                          ...prevState[key][
                                                            level2Key
                                                          ].slice(
                                                            0,
                                                            level2ArrayIndex
                                                          ),
                                                          {
                                                            ...prevState[key][
                                                              level2Key
                                                            ][level2ArrayIndex],
                                                            [level3Key]: [
                                                              ...prevState[key][
                                                                level2Key
                                                              ][
                                                                level2ArrayIndex
                                                              ][
                                                                level3Key
                                                              ].slice(
                                                                0,
                                                                level4ItemIndex
                                                              ),
                                                              {
                                                                ...prevState[
                                                                  key
                                                                ][level2Key][
                                                                  level2ArrayIndex
                                                                ][level3Key][
                                                                  level4ItemIndex
                                                                ],
                                                                [level5Key]:
                                                                  value,
                                                              },
                                                              ...prevState[key][
                                                                level2Key
                                                              ][
                                                                level2ArrayIndex
                                                              ][
                                                                level3Key
                                                              ].slice(
                                                                level4ItemIndex +
                                                                  1
                                                              ),
                                                            ],
                                                          },
                                                          ...prevState[key][
                                                            level2Key
                                                          ].slice(
                                                            level2ArrayIndex + 1
                                                          ),
                                                        ],
                                                      },
                                                    };
                                                  });
                                                }}
                                              />
                                            );
                                          }
                                        )}

                                      {/* Dynamic delete root */}
                                      {level2ArrayItem[level3Key]?.length > 1 &&
                                        !hideActions && (
                                          <Button
                                            leftIcon={<MdDelete size={24} />}
                                            // varient="primary"
                                            className={
                                              styles?.deleteButtonInner
                                            }
                                            onClick={() => {
                                              setPageData((prevState) => {
                                                return {
                                                  ...prevState,
                                                  [key]: {
                                                    ...prevState[key],
                                                    [level2Key]: [
                                                      ...prevState[key][
                                                        level2Key
                                                      ].slice(
                                                        0,
                                                        level2ArrayIndex
                                                      ),
                                                      {
                                                        ...prevState[key][
                                                          level2Key
                                                        ][level2ArrayIndex],
                                                        [level3Key]: [
                                                          ...prevState[key][
                                                            level2Key
                                                          ][level2ArrayIndex][
                                                            level3Key
                                                          ].slice(
                                                            0,
                                                            level4ItemIndex
                                                          ),
                                                          ...prevState[key][
                                                            level2Key
                                                          ][level2ArrayIndex][
                                                            level3Key
                                                          ].slice(
                                                            level4ItemIndex + 1
                                                          ),
                                                        ],
                                                      },
                                                      ...prevState[key][
                                                        level2Key
                                                      ].slice(
                                                        level2ArrayIndex + 1
                                                      ),
                                                    ],
                                                  },
                                                };
                                              });
                                            }}
                                          />
                                        )}
                                    </Col>
                                  </Row>
                                );
                              }
                            );
                          }
                        }

                        // strings
                        return renderInputFields({
                          path: `${key}.${level2Key}.${level2ArrayIndex}.${level3Key}`,
                          InputComponent: _InputComponent,
                          colCount: 12,
                          accessor: level2ArrayItem[level3Key],
                          currentLevelKey: level3Key,
                          cb: (value) => {
                            setPageData((prevState) => {
                              return {
                                ...prevState,
                                [key]: {
                                  ...prevState[key],
                                  [level2Key]: [
                                    ...prevState[key][level2Key].slice(
                                      0,
                                      level2ArrayIndex
                                    ),
                                    {
                                      ...prevState[key][level2Key][
                                        level2ArrayIndex
                                      ],
                                      [level3Key]: value,
                                    },
                                    ...prevState[key][level2Key].slice(
                                      level2ArrayIndex + 1
                                    ),
                                  ],
                                },
                              };
                            });
                          },
                        });
                      }
                    )}

                  {/* Dynamic delete root */}
                  {pageData[key][level2Key]?.length > 1 && !hideActions && (
                    <Button
                      leftIcon={<MdDelete size={24} color="var(--error)" />}
                      className={`${styles?.deleteButton} ${
                        typeof level2ArrayItem === "object" &&
                        styles?.deleteButtonInnerObj
                      }`}
                      onClick={handleArrayValueDelete.bind(this, {
                        key,
                        level2Key,
                        level2ArrayIndex,
                      })}
                    />
                  )}
                </div>
              );
            }
          )}
        </div>
      </Row>
    );
  };

  //   renderInputFields
  const renderInputFields = ({
    InputComponent,
    colCount,
    accessor, // eg: accessor: pageData[key][level2Key]
    currentLevelKey, // eg: currentLevelKey: level2Key
    cb,
    path,
  }) => {
    return (
      <Col md={colCount} key={currentLevelKey} className="mb-3">
        <InputComponent
          key={currentLevelKey}
          label={getFormattedParams(currentLevelKey)}
          placeholder={`Enter ${currentLevelKey}`}
          value={accessor}
          state={accessor}
          setValue={async (value) => {
            if (value === accessor) return;
            let newValue = value;
            // if image
            if (["icon", "photo", "image"].includes(currentLevelKey)) {
              setLoading("uploadImage");
              // delete old image
              if (accessor) {
                await Delete({
                  route: `cms/delete/media/${accessor}`,
                });
              }

              // upload new image
              const formData = new FormData();
              formData.append("photo", value);
              formData.append("pageName", pageName);
              formData.append("path", path);

              const { response } = await Post({
                route: `cms/upload/media`,
                data: formData,
                isFormData: true,
              });
              setLoading("");
              newValue = response?.key;
            }
            cb(newValue);
          }}
        />
      </Col>
    );
  };

  return (
    <Container className={mergeClass("containerFluid", styles?.main)}>
      <div className={styles.main}>
        <TopHeader heading={getFormattedParams(pageName)} />
        <LanguageSelector selected={selected} setSelected={setSelected} />
        <Container className="containerFluid">
          {loading === "initial" ? (
            <SpinnerLoading />
          ) : (
            <Row className={styles.mainContainer}>
              {pageData &&
                // Main Object
                Object.keys(pageData).length > 0 &&
                Object.keys(pageData).map((key, index) => {
                  // remove unwanted keys
                  if (unWantedKeys.includes(key)) return null;

                  let InputComponent = theInputComponent(key);
                  return (
                    <Row
                      key={index}
                      className={`${styles?.contentContainer} mb-5`}
                    >
                      <h5 className={`${styles?.heading2} mb-2`}>
                        {getFormattedParams(key)}
                      </h5>
                      {/* {typeof pageData[key] === "string" && (
                    <Col md={6} className="mb-2">
                      <InputComponent
                        label={key}
                        placeholder={`Enter ${key}`}
                        value={pageData[key]}
                        state={pageData[key]}
                        setValue={(value) => {
                          setPageData((prevState) => {
                            return {
                              ...prevState,
                              [key]: value,
                            };
                          });
                        }}
                      />
                    </Col>
                  )} */}

                      {/* Inner Object */}
                      {typeof pageData[key] === "object" &&
                        Object.keys(pageData[key]).map(
                          (level2Key, level2Index) => {
                            // remove unwanted keys
                            if (unWantedKeys.includes(level2Key)) return null;
                            InputComponent = theInputComponent(level2Key);

                            let colCount = 12;

                            // let colCount = [
                            //   ...descriptionFields,
                            //   ...htmlDescription,
                            // ].includes(level2Key)
                            //   ? 12
                            //   : 6;

                            // if typeof pageData[key][level2Key] === "Array"
                            if (Array.isArray(pageData[key][level2Key])) {
                              return renderArrayValues({
                                key,
                                level2Key,
                                InputComponent,
                                colCount,
                              });
                            }

                            // if typeof pageData[key][level2Key] === "object" && !Array.isArray(pageData[key][level2Key])
                            if (
                              typeof pageData[key][level2Key] === "object" &&
                              !Array.isArray(pageData[key][level2Key])
                            ) {
                              return (
                                <Row key={level2Index} className={`mb-3`}>
                                  <h5 className={`${styles?.heading2} mb-2`}>
                                    {getFormattedParams(level2Key)}
                                  </h5>
                                  {Object.keys(pageData[key][level2Key])
                                    .filter((e) => !unWantedKeys.includes(e))
                                    .map((level3Key, level3Index) => {
                                      // remove unwanted keys
                                      if (unWantedKeys.includes(level3Key))
                                        return null;
                                      InputComponent =
                                        theInputComponent(level3Key);

                                      return renderInputFields({
                                        InputComponent,
                                        colCount,
                                        accessor:
                                          pageData[key][level2Key][level3Key],
                                        path: `${key}.${level2Key}.${level3Key}`,
                                        currentLevelKey: level3Key,
                                        cb: (value) => {
                                          setPageData((prevState) => {
                                            return {
                                              ...prevState,
                                              [key]: {
                                                ...prevState[key],
                                                [level2Key]: {
                                                  ...prevState[key][level2Key],
                                                  [level3Key]: value,
                                                },
                                              },
                                            };
                                          });
                                        },
                                      });
                                    })}
                                </Row>
                              );
                            }

                            return renderInputFields({
                              InputComponent,
                              colCount,
                              accessor: pageData[key][level2Key],
                              path: `${key}.${level2Key}`,
                              currentLevelKey: level2Key,
                              cb: (value) => {
                                setPageData((prevState) => {
                                  return {
                                    ...prevState,
                                    [key]: {
                                      ...prevState[key],
                                      [level2Key]: value,
                                    },
                                  };
                                });
                              },
                            });
                          }
                        )}
                    </Row>
                  );
                })}
              {!["initialFetch", "uploadImage"].includes(loading) && (
                <Col md={12} className="mb-2">
                  <Button
                    variant={"primary"}
                    label={loading === "submit" ? "Saving..." : "Save"}
                    onClick={handleSubmit}
                    disabled={loading}
                  />
                </Col>
              )}
            </Row>
          )}
        </Container>
      </div>
    </Container>
  );
}

const imageFields = ["icon", "photo", "image", "video"];
const descriptionFields = ["title", "bulletPoints", "introduction"];
const htmlDescription = ["htmlDescription", "description"];

const theInputComponent = (key) => {
  if (descriptionFields.includes(key)) {
    return TextArea;
  } else if (htmlDescription.includes(key)) {
    return QuillInput;
  } else if (imageFields.includes(key)) {
    return ImageUpload;
  } else {
    return Input;
  }
};
