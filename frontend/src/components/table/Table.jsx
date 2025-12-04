import {useState} from "react";
import {fetchInfo} from "../api/Api";

const Table = () => {
    const [link, setLink] = useState("");
    const [tableHeadInfo, setTableHeadInfo] = useState(["userID","Text"]);
    const [tableBodyInfo, setTableBodyInfo] = useState();

    const pageInfo= () => {
        setTableHeadInfo(["userID","RealName"])
        setTableBodyInfo(fetchInfo({type:"page", link: link}));
    }
    const postInfo = () => {
        setTableHeadInfo(["userID","Text"])
        setTableBodyInfo(fetchInfo({type:"post", link: link}));
    }
    return (
        <>
            <div className="input-group mb-3 mt-3 p-3 w-75 container">
                <div className="input-group-prepend">
                    <button onClick={pageInfo} className="btn btn-outline-primary" type="button">Page</button>
                    <button onClick={postInfo} className="btn btn-outline-secondary" type="button">Post</button>
                </div>
                <input type="text" className="form-control" placeholder="enter your link here" onChange={(e) => {setLink(e.target.value)}} value={link}
                       aria-describedby="basic-addon1"/>
            </div>
            <hr/>
            <div className="mb-3 mt-3 p-3 w-75 container">
                <table className="table table-striped">
                    <thead>
                    <tr>
                        <th scope="col">#</th>
                        <th scope="col">{tableHeadInfo[0]}</th>
                        <th scope="col">{tableHeadInfo[1]}</th>
                    </tr>
                    </thead>
                    <tbody>
                    {
                        [tableBodyInfo].keys().map((item, index) => (
                            <tr>
                                <th scope="row">{index + 1}</th>
                                <td>{item[tableHeadInfo[0]]}</td>
                                <td>{item[tableHeadInfo[1]]}</td>
                            </tr>
                        ))
                    }

                    </tbody>
                </table>

            </div>


        </>
    )
}
export default Table;