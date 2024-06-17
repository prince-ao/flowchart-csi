"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { isLoggedIn, logout, withAuth } from "@/utils/authentication";
import { supabase } from "@/utils/supabase";
import {
  getAllFlowcharts,
  displayYear,
  getDegrees,
  createNewFlowchart,
  getFlowchartEnv,
  getDegreeMapYears,
  deleteDegreeMap,
  addDegree,
  deleteDegree,
} from "@/utils/flowchart-api";
import AdminSideBar from "@/app/_components/AdminSideBar";

function AdminHomeUpdate() {
  const [isAuth, setIsAuth] = useState(false);
  const [flowChartUploadName, setFlowChartUploadName] = useState("");
  const [flowcharts, setFlowcharts] = useState([]);
  const [degrees, setDegrees] = useState([]);
  const [selectedChart, setSelectedChart] = useState(null);
  const [file, setFile] = useState(null);
  const [flowchartYear, setFlowchartYear] = useState("");
  const [createFlowchartYear, setCreateFlowchartYear] = useState("");
  const [successUploadMessage, setSuccessUploadMessage] = useState("");
  const [errorUploadMessage, setErrorUploadMessage] = useState("");
  const [track, setTrack] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [degree, setDegree] = useState("");
  const [fileNameError, setFileNameError] = useState(false);
  const [createFileNameError, setCreateFileNameError] = useState(false);
  const [uploadError, setUploadError] = useState(false);
  const [selectEdit, setSelectEdit] = useState("");
  const [selectDelete, setSelectDelete] = useState("");
  const [selectDegreeDelete, setSelectDegreeDelete] = useState("");
  const [degreeLoading, setDegreeLoading] = useState(true);
  const [addDegreeState, setAddDegreeState] = useState("");
  const [degreeName, setDegreeName] = useState("");
  const [degreeDeleteSuccess, setDegreeDeleteSuccess] = useState(false);

  const router = useRouter();
  const flowchartEnv = getFlowchartEnv();

  async function handleFileUpload() {
    setFileNameError(false);
    setUploadError(false);
    if (!file) {
      setUploadError(true);
      alert("Please select a file.");
      return;
    }

    if (!/^\d{4}-\d{4}$/.test(flowchartYear)) {
      setFileNameError(true);
      return;
    }

    const reader = new FileReader();

    reader.onload = async function () {
      try {
        const json = JSON.parse(reader.result);

        console.log(degree);
        await createNewFlowchart(json, flowchartYear, degree);

        setSuccessUploadMessage("Flowchart uploaded successfully.");
        setFlowchartYear("");
        setTimeout(() => {
          setSuccessUploadMessage("");
        }, 2 * 1e3);
      } catch (err) {
        if (err.message.includes("duplicate key")) {
          alert("degree map year already exists");
          setFlowchartYear("");
          setFileNameError(true);
        }
      }
    };
    reader.readAsText(file);
  }

  async function updateDegreeMaps(degree) {
    const flowcharts = await getDegreeMapYears(degree);
    setFlowcharts(flowcharts[0][flowchartEnv]);
  }

  useEffect(() => {
    (async () => {
      try {
        setIsLoading(true);

        setDegreeLoading(true);
        const degrees = await getDegrees();
        setDegrees(degrees);
        setDegree(degrees[0].name);
        setDegreeLoading(false);

        await updateDegreeMaps(degrees[0].name);

        setIsLoading(false);
      } catch (e) {
        console.log(e);
      }
    })();
    setTimeout(() => {
      setIsAuth(true);
    }, 500);
  }, []);

  function goToLoginError() {
    localStorage.setItem("homeAuthFailed", "true");
    router.push("/admin/login");
  }

  function handleLogout() {
    logout();
    router.push("/admin/login");
  }

  async function handleDegreeChange(e) {
    setIsLoading(true);
    setDegree(e.target.value);
    await updateDegreeMaps(e.target.value);
    setSelectedChart(null);
    setIsLoading(false);
  }

  async function updateDegree() {
    setDegreeLoading(true);
    setIsLoading(true);
    const degrees = await getDegrees();
    setDegrees(degrees);
    if (degrees.length) setDegree(degrees[0].name);
    setDegreeLoading(false);

    await updateDegreeMaps(degrees[0].name);

    setIsLoading(false);
  }

  return (
    <main className="h-lvh flex" role="login-home">
      <dialog id="delete_modal" className="modal">
        <div className="modal-box">
          <form method="dialog">
            <button className="btn btn-sm btn-circle btn-ghost absolute right-2 top-2">
              ✕
            </button>
          </form>
          <p className="py-4">
            ⚠️ Are you sure you want to delete{" "}
            <span className="font-bold">
              {selectDelete} | {degree}
            </span>
          </p>
          <div className="modal-action justify-start">
            <form method="dialog" className="flex gap-4">
              <button
                className="btn btn-error"
                onClick={async () => {
                  try {
                    deleteDegreeMap(selectDelete, degree);
                    router.push("/admin/home");
                  } catch (e) {
                    console.log(e);
                  }
                }}
              >
                Delete
              </button>
              <button className="btn">Close</button>
            </form>
          </div>
        </div>
        <form method="dialog" className="modal-backdrop">
          <button>close</button>
        </form>
      </dialog>
      <AdminSideBar />
      <div className="w-4/5">
        <div className="flex justify-end pe-2 pt-2">
          <button className=" btn btn-primary" onClick={handleLogout}>
            Log out
          </button>
        </div>

        <div className="flex flex-col items-center mb-16">
          <h2 className="text-3xl font-bold mb-4">Computer Science Degree</h2>
          {degreeLoading ? (
            <div className="stat-value loading loading-spinner loading-lg text-center"></div>
          ) : (
            <select
              className="select select-bordered w-full max-w-xs"
              onChange={handleDegreeChange}
            >
              {degrees.length === 0 ? (
                <option disabled>none</option>
              ) : (
                <>
                  {degrees.map((degree, i) => (
                    <option key={i} value={degree.name}>
                      {degree.name}
                    </option>
                  ))}
                </>
              )}
            </select>
          )}
        </div>

        {isLoading ? (
          <div className="flex justify-center items-center">
            <div className="stat-value loading loading-spinner loading-lg text-center"></div>
          </div>
        ) : (
          <>
            <div className="grid gap-8 grid-cols-1">
              <div className="flex flex-col justify-center items-center">
                <h2 className="text-2xl font-bold text-center mb-4">
                  Manage Prerequisite Flowcharts
                </h2>
                <div className="stats shadow stats-vertical md:stats-horizontal">
                  <div className="stat">
                    <div className="text-xl font-bold text-center">
                      Upload Prerequisite Flowcharts
                    </div>
                    <input
                      type="file"
                      className={`file-input file-input-primary w-full mb-4 max-w-xs ${
                        uploadError && "file-input-error"
                      }`}
                      onChange={(e) => setFile(e.target.files[0])}
                    />
                    <input
                      type="text"
                      className={`input input-primary w-full max-w-xs ${
                        fileNameError && "input-error"
                      }`}
                      placeholder="Flowchart Year"
                      onChange={(e) => setFlowchartYear(e.target.value)}
                    />
                    <p
                      className={`text-xs mb-4 !mt-0 ${
                        fileNameError ? "text-error" : ""
                      }`}
                    >
                      must be in the format &#123;start year&#125;-&#123;end
                      year&#125;
                    </p>
                    <button
                      className="btn btn-primary"
                      onClick={handleFileUpload}
                    >
                      Upload
                    </button>
                    {successUploadMessage && (
                      <div className="text-center text-success">
                        {successUploadMessage}
                      </div>
                    )}
                    {errorUploadMessage && (
                      <div className="text-center text-error">
                        {errorUploadMessage}
                      </div>
                    )}
                  </div>
                  <div className="stat">
                    <div className="text-xl font-bold text-center">
                      Create Flowchart
                    </div>
                    <input
                      type="text"
                      className={`input input-primary w-full max-w-xs ${
                        createFileNameError && "input-error"
                      }`}
                      placeholder="Flowchart Year"
                      onChange={(e) => setCreateFlowchartYear(e.target.value)}
                    />
                    <p
                      className={`text-xs mb-4 !mt-0 ${
                        createFileNameError ? "text-error" : ""
                      }`}
                    >
                      must be in the format &#123;start year&#125;-&#123;end
                      year&#125;
                    </p>
                    <button
                      className="btn btn-primary"
                      onClick={() => {
                        if (!/^\d{4}-\d{4}$/.test(createFlowchartYear)) {
                          setCreateFileNameError(true);
                          return;
                        }
                        router.push(
                          `/flowchart/create?year=${createFlowchartYear}&degree=${degree}`
                        );
                      }}
                    >
                      Get Started
                    </button>
                  </div>
                  <div className="stat">
                    <div className="text-xl font-bold text-center">
                      Edit Flowcharts
                    </div>
                    <select
                      className="select select-primary w-full max-w-xs"
                      onChange={(e) => setSelectEdit(e.target.value)}
                    >
                      <option disabled selected>
                        Edit a Flowchart
                      </option>
                      {flowcharts
                        .map((flowchart) => flowchart.flowchart_year)
                        .map((year, index) => (
                          <option key={index} value={year}>
                            {displayYear(year)}
                          </option>
                        ))}
                    </select>
                    <button
                      disabled={selectEdit === ""}
                      className="btn btn-primary"
                      onClick={() => {
                        router.push(
                          `/flowchart/edit?year=${selectEdit}&degree=${degree}`
                        );
                      }}
                    >
                      Edit
                    </button>
                  </div>
                  <div className="stat">
                    <div className="text-xl font-bold text-center">
                      Delete Flowchart
                    </div>
                    <select
                      className="select select-primary w-full max-w-xs"
                      onChange={(e) => setSelectDelete(e.target.value)}
                    >
                      <option disabled selected>
                        Delete a Flowchart
                      </option>
                      {flowcharts
                        .map((flowchart) => flowchart.flowchart_year)
                        .map((year, index) => (
                          <option key={index} value={year}>
                            {displayYear(year)}
                          </option>
                        ))}
                    </select>
                    <button
                      disabled={selectDelete === ""}
                      className="btn btn-primary"
                      onClick={() => {
                        document.getElementById("delete_modal").showModal();
                      }}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid gap-8 grid-cols-1 mt-16">
              <div className="flex flex-col justify-center items-center">
                <h2 className="text-2xl font-bold text-center mb-4">
                  Manage Degrees
                </h2>
                <div className="stats shadow stats-vertical md:stats-horizontal">
                  <form
                    className="stat"
                    onSubmit={async (e) => {
                      e.preventDefault();
                      const formData = new FormData(e.target);
                      const degree_name = formData.get("degree_name");
                      let degree_color = formData.get("degree_color");

                      if (degree_name === "") {
                        setAddDegreeState("error");
                        return;
                      }

                      if (degree_color === "#000000") {
                        degree_color = "#1e90ff";
                      }

                      addDegree(degree_name, degree_color);
                      setAddDegreeState("success");

                      setDegreeName("");

                      setTimeout(() => {
                        setAddDegreeState("");
                        updateDegree();
                      }, 3 * 1e3);
                    }}
                  >
                    <h2 className="text-xl font-bold text-center">
                      Add Degree
                    </h2>
                    <input
                      name="degree_name"
                      type="text"
                      value={degreeName}
                      onChange={(e) => setDegreeName(e.target.value)}
                      className={`input input-primary mb-4 w-full max-w-xs ${
                        addDegreeState === "error"
                          ? "input-error"
                          : addDegreeState === "success"
                          ? "input-success"
                          : ""
                      }`}
                      placeholder="Degree Name"
                    />

                    <h3>Select a degree color:</h3>
                    <input
                      type="color"
                      id="degree-color"
                      name="degree_color"
                      className="mb-4"
                      defaultValue={"#000"}
                    />
                    {addDegreeState === "success" && (
                      <p className="text-success">Degree Added</p>
                    )}
                    <button
                      className="btn btn-primary"
                      onClick={() => {}}
                      type="submit"
                    >
                      Add
                    </button>
                  </form>
                  <div className="stat">
                    <div className="text-xl font-bold text-center">
                      Delete Degree
                    </div>
                    <select
                      className="select select-primary w-full max-w-xs"
                      onChange={(e) => setSelectDegreeDelete(e.target.value)}
                    >
                      <option disabled selected>
                        Delete a Degree
                      </option>
                      {degrees.map((degree, i) => (
                        <option key={i} value={degree.name}>
                          {degree.name}
                        </option>
                      ))}
                    </select>
                    {degreeDeleteSuccess && (
                      <p className="text-success">
                        The degree was successfully deleted
                      </p>
                    )}
                    <button
                      disabled={selectDegreeDelete === ""}
                      className="btn btn-primary"
                      onClick={() => {
                        deleteDegree(selectDegreeDelete);
                        setDegreeDeleteSuccess(true);
                        setTimeout(() => {
                          setDegreeDeleteSuccess(false);
                          updateDegree();
                        }, 3 * 1e3);
                      }}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </main>
  );
}

export default withAuth(
  AdminHomeUpdate,
  () => {},
  () => {
    localStorage.setItem("homeAuthFailed", "true");
  },
  "/admin/login",
  ""
);
