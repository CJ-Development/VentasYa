import "./QuickActions.css";

import {
    Plus,
    FolderTree,
    Tags,
    Percent
} from "lucide-react";

function QuickActions() {

    const actions = [

        {
            icon:<Plus size={20}/>,
            title:"Nuevo producto"
        },

        {
            icon:<FolderTree size={20}/>,
            title:"Nueva categoría"
        },

        {
            icon:<Tags size={20}/>,
            title:"Nueva marca"
        },

        {
            icon:<Percent size={20}/>,
            title:"Nueva oferta"
        }

    ];

    return(

        <section className="quick-actions">

            <h2>Acciones rápidas</h2>

            <div className="quick-grid">

                {

                    actions.map((action,index)=>(

                        <button key={index}>

                            {action.icon}

                            {action.title}

                        </button>

                    ))

                }

            </div>

        </section>

    );

}

export default QuickActions;