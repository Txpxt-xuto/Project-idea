#include <iostream>
using namespace std;
int main()//Digital signal (Square wave)//
{
    int wave,i;
    cin >> wave;
    cout << "  ";
    for(i=1;i<=wave;i++) cout << "* * * *     ";
    cout << endl << "  ";
    for(i=1;i<=wave;i++) cout << "*     *     ";
    cout << endl << "  ";
    for(i=1;i<=wave;i++) cout << "*     *     ";
    cout << endl << "* *";
    for(i=1;i<wave;i++) cout << "     * * * *";
    cout << "     * *";
}