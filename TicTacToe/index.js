let boxs = document.querySelectorAll(".box");

let turn = "X";
let Gamerover = false;

boxs.forEach(e =>{
    e.innerHTML = ""
    e.addEventListener("click", ()=>{
        if(!Gamerover && e.innerHTML === ""){
            e.innerHTML = turn;
            cheakWin();
            cheakDraw();
            changeTurn();
        }
    })
})

function changeTurn()
{
    if(turn === "X")
    {
        turn = "O"
        document.querySelector(".bg").style.left = "85px";
    }
    else if(turn === "O")
    {
        turn = "X"
        document.querySelector(".bg").style.left = "0px";
    }
}

function cheakWin()
{
    let winCoditions = [
        [0,1,2],[3,4,5],[6,7,8],
        [0,3,6],[1,4,7],[2,5,8],
        [0,4,8],[2,4,6]
    ]
    for(let i=0;i<winCoditions.length;i++)
    {
        let v0 = boxs[winCoditions[i][0]].innerHTML;
        let v1 = boxs[winCoditions[i][1]].innerHTML;
        let v2 = boxs[winCoditions[i][2]].innerHTML;

        if(v0 != "" && v0 === v1 && v0 === v2)
        {
            Gamerover = turn;            
            document.querySelector("#results"),innerHTML = turn + "win";
            document.querySelector("#play-again").style.display = "inline";
            for(j=0;j<3;j++)
            {
                boxs[winCoditions[i][j]].style.backgroundColor = "#08D9D6"
                boxs[winCoditions[i][j]].style.color = "#000"
            }
        }
    }
}

function cheakDraw()
{
    if(!Gamerover)
    {
        let isDraw = true;
        boxs.forEach(e =>{
            if(e.innerHTML === "") isDraw = false;
        })

        if(isDraw)
        {
            Gamerover = true;
            document.querySelector("#results").innerHTML = "Draw";
            document.querySelector("#play-again").style.display = "inline";
        }
    }
}

document.querySelector("#play-again").addEventListener("click",()=>{
    Gamerover = false;
    turn = "X";
    document.querySelector(".bg").style.left = "0";
    document.querySelector("#results").innerHTML = "";
    document.querySelector("#play-again").style.display = "none";

    boxs.forEach(e=>{
        e.innerHTML = "";
        e.style.removeProperty("background-color");
        e.style.color = "#fff"
    })
})