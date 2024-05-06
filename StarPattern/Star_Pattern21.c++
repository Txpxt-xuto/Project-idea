#include <iostream>
using namespace std;
int i,j,k;
void pattern(int t) //ว่าวสี่เหลี่ยมขนมเปียกปูน//
{
    int c1 = (t-1)/2;
    int c2 = 3*t/2-1;
    for(i=0;i<t;i++)
    {
        for(j=0;j<t;j++)
        {
            if(i+j == c1 || i-j == c1 || j-i == c1 || i+j == c2 || i == c1 || j == c1)
            {
                cout << "*";
            }
            else
            {
                cout << " ";
            }
        }
        cout << endl;
    }
}
int  main()
{
    int n;
    cin >> n;
    pattern(n);
    return 0;
}