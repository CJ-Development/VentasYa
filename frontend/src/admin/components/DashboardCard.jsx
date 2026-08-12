import "./DashboardCard.css";


function DashboardCard({
    icon,
    title,
    value,
    extra,
    type
}) {

    return (

        <article className={`dashboard-card ${type || ""}`}>

            <div className="dashboard-card-header">

                <div className="card-icon">

                    {icon}

                </div>


                <span className="card-title">

                    {title}

                </span>


                <span className="card-arrow">

                    <ArrowUpRightIcon />

                </span>

            </div>


            <div className="card-body">

                <h2>
                    {value}
                </h2>

                <p>
                    {extra}
                </p>

            </div>

        </article>

    );

}


function ArrowUpRightIcon() {

    return (

        <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        >

            <path d="M7 17 17 7" />

            <path d="M7 7h10v10" />

        </svg>

    );

}


export default DashboardCard;