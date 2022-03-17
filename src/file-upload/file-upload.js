import React, { useState, useRef } from "react"
import "./file-upload.css"

const DEFAULT_MAX_FILE_SIZE_IN_BYTES = 500000;
const KILO_BYTES_PER_BYTE = 1000;

const convertBytesToKB = (bytes) => Math.round(bytes / KILO_BYTES_PER_BYTE);


// convert the files state to an array
const convertNestedObjectToArray = (nestedObj) =>
  Object.keys(nestedObj).map((key) => nestedObj[key]);


const FileUpload = ({
  label,
  updateFilesCb,
  maxFileSizeInBytes = DEFAULT_MAX_FILE_SIZE_IN_BYTES,
  ...otherProps
}) => {
  const fileInputField = useRef(null);
  const [files, setFiles] = useState({});



  const addNewFiles = (newFiles) => {
    for (let file of newFiles) {
      if (file.size <= maxFileSizeInBytes) {
        if (!otherProps.multiple) {
          return { file };
        }
        files[file.name] = file;
      }
    }
    return {...files };
  };


  const callUpdateFilesCb = (files) => {
    // convert the files state to an array
    const filesAsArray = convertNestedObjectToArray(files);
    // call updateFilesCb function from props
    updateFilesCb(filesAsArray)
  };

  const removeFile = (fileName) => {
    delete files[fileName];
    setFiles({...files });
    callUpdateFilesCb({...files });
  };


  const handleUploadBtnClick = () => {
    fileInputField.current.click();
  };

  // access files selected by e.target.files property
  const handleNewFileUpload = (e) => {
    const { files: newFiles } = e.target;

    if (newFiles.length) {
      let updatedFiles = addNewFiles(newFiles);
      setFiles(updatedFiles);
      callUpdateFilesCb(updatedFiles);
    }
  };

  return (
    <>
      <section className="FileUploadContainer">
        <label className="InputLabel">{label}</label>
        <p>Drag and drop your files anywhere or</p>
        <button type="button" className="UploadBtn" onClick={handleUploadBtnClick}>
          <i className="fa-file-upload" />
          <span>Upload {otherProps.multiple ? "files" : "a file"}</span>
        </button>
        <input
          className="FormField"
          type="file"
          ref={fileInputField}
          onChange={handleNewFileUpload}
          title=""
          value=""
          {...otherProps}
        />
      </section>


      {/*second part starts here*/}
      <article className="FilePreviewContainer">
        <span>To Upload</span>
        <section className="Preview">
          {Object.keys(files).map((fileName, index) => {
            let file = files[fileName];
            let isImageFile = file.type.split("/")[0] === "image";
            return (
              <section key={fileName} className="PreviewContainerSec">
                <div>
                  {isImageFile && (
                    <img
                      src={URL.createObjectURL(file)}
                      alt={`file preview ${index}`}
                    />
                  )}
                  <div isImageFile={isImageFile} className="FileMeta">>
                    <span>{file.name}</span>
                    <aside>
                      <span>{convertBytesToKB(file.size)} kb</span>
                      <i className="fa-trash-alt" onClick={() => removeFile(fileName)} />
                    </aside>
                  </div>
                </div>
              </section>
            );
          })}
        </section>
      </article>


    </>
  );
}

export default FileUpload;
