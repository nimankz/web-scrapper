import { useState } from "react";
import { fetchInfo } from "../api/Api";

const Table = () => {
    const [link, setLink] = useState("");
    const [rows, setRows] = useState([]);
    const [columns, setColumns] = useState(["نوع", "کاربر", "متن/لینک"]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const handleRequest = async (type) => {
        setError("");
        setRows([]);
        setLoading(true);
        try {
            const result = await fetchInfo({ type, link });
            if (result.kind === 'post') {
                setColumns(["#", "کاربر", "متن"]);
                const comments = result.data.comments || [];
                setRows(comments.map((item, idx) => {
                    const commentText = item.text ?? item.comment ?? "";

                    return {
                        index: idx + 1,
                        user: item.username || "-",
                        value: commentText,
                    };
                }));
            } else if (result.kind === 'profile') {
                setColumns(["نوع", "کاربر", "لینک"]);
                const followers = (result.data.followers || []).map((item) => ({
                    type: "Follower",
                    user: item.username,
                    value: item.url,
                }));
                const following = (result.data.following || []).map((item) => ({
                    type: "Following",
                    user: item.username,
                    value: item.url,
                }));
                setRows([...followers, ...following]);
            }
        } catch (err) {
            const msg = err.response?.data?.error || err.message || "خطای ناشناخته";
            setError(msg);
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            <div className="input-group mb-3 mt-3 p-3 w-75 container">
                <div className="input-group-prepend">
                    <button onClick={() => handleRequest('profile')} className="btn btn-outline-primary" type="button">Page</button>
                    <button onClick={() => handleRequest('post')} className="btn btn-outline-secondary ms-2" type="button">Post</button>
                </div>
                <input
                    type="text"
                    className="form-control ms-2"
                    placeholder="لینک اینستاگرام را وارد کنید"
                    onChange={(e) => setLink(e.target.value)}
                    value={link}
                    aria-describedby="basic-addon1"
                />
            </div>

            {error && (
                <div className="alert alert-danger w-75 container" role="alert">
                    {error}
                </div>
            )}

            {loading && (
                <div className="w-75 container">در حال دریافت...</div>
            )}

            {!loading && rows.length > 0 && (
                <div className="mb-3 mt-3 p-3 w-75 container">
                    <table className="table table-striped">
                        <thead>
                        <tr>
                            {columns.map((col) => (
                                <th scope="col" key={col}>{col}</th>
                            ))}
                        </tr>
                        </thead>
                        <tbody>
                        {rows.map((row, index) => (
                            <tr key={`${row.user}-${index}`}>
                                {columns[0] === "#" ? (
                                    <>
                                        <th scope="row">{row.index}</th>
                                        <td>{row.user}</td>
                                        <td>{row.value}</td>
                                    </>
                                ) : (
                                    <>
                                        <th scope="row">{row.type}</th>
                                        <td>{row.user}</td>
                                        <td><a href={row.value} target="_blank" rel="noreferrer">{row.value}</a></td>
                                    </>
                                )}
                            </tr>
                        ))}
                        </tbody>
                    </table>

                </div>
            )}
        </>
    );
};

export default Table;