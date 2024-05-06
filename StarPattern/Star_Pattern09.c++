#include <iostream>
using namespace std;
int main()//เครื่องหมายลูกศร//
{
    int i,j,n;
    cin >> n;
    for(j=0;j<(n-1)/2;j++)
    {
        for(i=0;i<(n-1)/2+j;i++) cout << "    ";
        cout << "[]" << endl;
    }
    cout << endl;
    for(i=0;i<n;i++) cout << "[]  ";
    cout << endl << endl;
    for(j=(n-1)/2;j>0;j--)
    {
        for(i=1;i<(n-1)/2+j;i++) cout << "    ";
        cout << "[]" << endl;
    }
}