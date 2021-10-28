const createContainerButton = document.getElementById("create-container-button");
const deleteContainerButton = document.getElementById("delete-container-button");
const selectButton = document.getElementById("select-button");
const fileInput = document.getElementById("file-input");
const listButton = document.getElementById("list-button");
const deleteButton = document.getElementById("delete-button");
const status = document.getElementById("status");
const fileList = document.getElementById("file-list");
const filetable = document.getElementById("filetable");

const about = document.getElementById("about");
const listfiles = document.getElementById("listfiles");

const reportStatus = message => {
    console.log(message);
}

const accountendpoint = "https://blobindexsa.blob.core.windows.net"; 
const sastoken = "?sv=2020-08-04&ss=b&srt=sco&sp=rwdlactf&se=2021-10-29T16:03:28Z&st=2021-10-25T08:03:28Z&spr=https&sig=%2FlSavuGaQiNns8vRbmw4nfh97cihX3%2BI4GV5K4Qc4qo%3D";
const containerName = "productcatalog";
const blobSasUrl = accountendpoint+sastoken;

const { BlobServiceClient, ContainerListBlobsOptions } = require("@azure/storage-blob");

const blobServiceClient = new BlobServiceClient(blobSasUrl);
const containerClient = blobServiceClient.getContainerClient(containerName);

const createContainer = async () => {
    try {
        reportStatus(`Creating container "${containerName}"...`);
        await containerClient.create();
        reportStatus(`Done.`);
    } catch (error) {
        reportStatus(error.message);
    }
};

const deleteContainer = async () => {
    try {
        reportStatus(`Deleting container "${containerName}"...`);
        await containerClient.delete();
        reportStatus(`Done.`);
    } catch (error) {
        reportStatus(error.message);
    }
};

//createContainerButton.addEventListener("click", createContainer);
//deleteContainerButton.addEventListener("click", deleteContainer);

const listFiles = async () => {
    fileList.size = 0;
    fileList.innerHTML = "";
    try {
        reportStatus("Retrieving file list...");
        let iter = containerClient.listBlobsFlat();
        let blobItem = await iter.next();
        while (!blobItem.done) {
            fileList.size += 1;
            fileList.innerHTML += `<option>${blobItem.value.name}</option>`;
            blobItem = await iter.next();
        }
        if (fileList.size > 0) {
            reportStatus("Done.");
        } else {
            reportStatus("The container does not contain any files.");
        }
    } catch (error) {
        reportStatus(error.message);
    }
};

if (listButton!=null)
{
    listButton.addEventListener("click", listFiles);
}

const listBlobs = async () => {
    filetable.innerHTML = "";
    try {
        let iter = containerClient.listBlobsFlat({includeTags: true});
        let blobItem = await iter.next();
        while (!blobItem.done) {
            if (filetable != null)
                filetable.innerHTML += `<tr><td>${blobItem.value.name}</td><td>${TagsToString(blobItem.value.tags)}</td><td><img src="${BlobnameToUri(blobItem.value.name)}" width="100"></td></tr>`;
            blobItem = await iter.next();
        }
    } catch (error) {
        reportStatus(error.message);
    }
};

function TagsToString(tags){
    var result = "";
    if (tags != null)
    {
        console.log(tags);
        result += tags.category + ";";
        result += tags.order + ";";
        result += tags.price + ";";
        result += tags.product;
    }
    return result;
}

function BlobnameToUri(blobname){
    return accountendpoint + "/" + containerName + "/" + blobname + sastoken;
}

const listbody = document.getElementById("listbody");

if (listbody!=null)
{
    //listbody.addEventListener("load", listFiles, false);
    listBlobs();
}

const getCategories = async () => {
    var query = "@container = '" + containerName + "' AND product = ''";
    await findBlobs(query);
}

const getProducts = async (category) => {
    console.log(category);
    var query = "@container = '" + containerName + "' AND product > '0' AND category = '" + category + "'";
    console.log(query);
    await findBlobs(query);
}

const findBlobs = async (query) => {
    filetable.innerHTML = "";
    try {
        let iter = blobServiceClient.findBlobsByTags(query);
        let blobItem = await iter.next();
        while (!blobItem.done) {
            if (filetable != null)
            {
                console.log(blobItem.value.name);
                var blobClient = containerClient.getBlobClient(blobItem.value.name);

                var mytaggedblob = await getTags (blobClient);

                filetable.innerHTML += `<tr><td>
                <a href="./products.html">
                    <img src="${mytaggedblob.Url}" width="200">
                    <br/>
                    $ ${mytaggedblob.Price}
                    <br/>
                    <b>${mytaggedblob.Category}</b>
                    <br/>
                    ${mytaggedblob.Product}
                </a> 
                </td></tr><tr><td>&nbsp;</td></tr>`;
            }
            blobItem = await iter.next();
        }
    } catch (error) {
        reportStatus(error.message);
    }
};

const indexbody = document.getElementById("indexbody");
if (indexbody!=null)
{
    getCategories();
}

const productsbody = document.getElementById("productsbody");
if (productsbody!=null)
{
    getProducts("Raging red");
}


const getTags = async (blobclient) => {
    taggedblob = {};

    taggedblob.Name = blobclient.name;
    taggedblob.Url = blobclient.url;

    var mytags = await blobclient.getTags();

    // console.log(mytags.TagSet.Tag);

    for (var i = 0; i< mytags.TagSet.Tag.length; i++)
    {
        var tag = mytags.TagSet.Tag[i];
        // console.log(tag.Key);
        // console.log(tag.Value);
        switch (tag.Key)
        {
            case "category":
                taggedblob.Category = tag.Value;
                break;
            case "product":
                taggedblob.Product = tag.Value;
                break;
            case "price":
                taggedblob.Price = tag.Value;
                break;
            case "order":
                taggedblob.Order = tag.Value;
                break;
        }
    }

    console.log(taggedblob);

    return taggedblob;

}

const uploadFiles = async () => {
    try {
        reportStatus("Uploading files...");
        const promises = [];
        for (const file of fileInput.files) {
            const blockBlobClient = containerClient.getBlockBlobClient(file.name);
            promises.push(blockBlobClient.uploadBrowserData(file));
        }
        await Promise.all(promises);
        reportStatus("Done.");
        listFiles();
    }
    catch (error) {
            reportStatus(error.message);
    }
}

if (selectButton != null)
    selectButton.addEventListener("click", () => fileInput.click());

if (fileInput != null)
    fileInput.addEventListener("change", uploadFiles);

const deleteFiles = async () => {
    try {
        if (fileList.selectedOptions.length > 0) {
            reportStatus("Deleting files...");
            for (const option of fileList.selectedOptions) {
                await containerClient.deleteBlob(option.text);
            }
            reportStatus("Done.");
            listFiles();
        } else {
            reportStatus("No files selected.");
        }
    } catch (error) {
        reportStatus(error.message);
    }
};

//deleteButton.addEventListener("click", deleteFiles);

// function load_about() {
//     document.getElementById("app").innerHTML='<object type="text/html" data="./about.html" ></object>';
// }
// about.addEventListener("click", load_about);

// function load_listfiles() {
//     document.getElementById("app").innerHTML='<object type="text/html" data="listfiles.html" ></object>';
// }
// listfiles.addEventListener("click", load_listfiles);

