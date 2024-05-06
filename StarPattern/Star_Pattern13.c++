#include <iostream>
using namespace std;
int main()//เครื่องหมายบวก//
{
    int i,j,n;
    cin >> n; 
    for(i=1;i<=n/2;i++)
    {
        for(j=1;j<=n/2;j++)
        {
            cout << "  ";
        }
        cout << "*" << endl;
    }
    for(i=1;i<=n;i++)
    {
        cout << "* ";
    }
    cout << endl;
    for(i=1;i<=n/2;i++)
    {
        for(j=1;j<=n/2;j++)
        {
            cout << "  ";
        }
        cout << "*" << endl;
    }
}