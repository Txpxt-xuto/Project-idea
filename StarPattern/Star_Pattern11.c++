#include <iostream>
using namespace std;
int main()//ตาราตัวเลข//
{
    int i,k=1,n;
    cin >> n; // ระบุแถว
    for(i=0;i<n;i++)
    {
        if(i%2==0)
        {
            cout << k ;
            k++;
            cout << " * " << k << " * " ;
            k++;
            cout << k << endl;
            k++;
        }
        else 
        {
            cout << "* " << k << " * " ;
            k++;
            cout << k << " *" << endl ;
            k++;
        }
    }
    /*
    Ex.1
    
    input 5 

    output
    1 * 2 * 3
    * 4 * 5 *
    6 * 7 * 8
    * 9 * 10 *
    11 * 12 * 13
    */
}