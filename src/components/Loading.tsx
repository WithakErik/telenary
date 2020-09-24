/*    3RD PARTY IMPORTS   */
import { Spin } from "antd";
import { LoadingOutlined } from "@ant-design/icons";
import * as React from "react";

/*    VARIABLES   */
const antIcon = <LoadingOutlined style={{ fontSize: 48 }} spin />;
const loadingStyle = {
  alignItems: "center",
  background: "rgba(0, 0, 0, 0.69)",
  height: "100%",
  display: "flex",
  justifyContent: "center",
  left: 0,
  top: 0,
  width: "100%",
};

export default function Loading({ isLoading }: { isLoading: boolean }) {
  return (
    <>
      {isLoading && (
        // Typescript was complaingin about `position: 'fixed'` not being correct
        <div
          style={{
            ...loadingStyle,
            flexDirection: "column",
            position: "fixed",
          }}
        >
          <Spin indicator={antIcon} />
        </div>
      )}
    </>
  );
}
